'use strict';

const uuid = require('uuid');

const AttackObject = require('../models/attack-object-model');
const Matrix = require('../models/matrix-model');
const Mitigation = require('../models/mitigation-model');
const Note = require('../models/note-model');
const Relationship = require('../models/relationship-model');
const Software = require('../models/software-model');
const Tactic = require('../models/tactic-model');
const Technique = require('../models/technique-model');

const linkById = require('../lib/linkById');
const config = require('../config/config');

const errors = {
  notFound: 'Domain not found',
};
exports.errors = errors;

// Retrieve the attack object from the database using its STIX ID
async function getAttackObject(stixId) {
  const attackObject = await AttackObject.findOne({ 'stix.id': stixId })
    .sort('-stix.modified')
    .lean()
    .exec();

  return attackObject;
}

const attackIdObjectTypes = [
  'intrusion-set',
  'campaign',
  'malware',
  'tool',
  'attack-pattern',
  'course-of-action',
  'x-mitre-data_source',
];
function requiresAttackId(attackObject) {
  return attackIdObjectTypes.includes(attackObject?.stix.type);
}

function hasAttackId(attackObject) {
  if (attackObject) {
    const externalReferences = attackObject?.stix?.external_references;
    if (Array.isArray(externalReferences) && externalReferences.length > 0) {
      const mitreAttackReference = externalReferences.find((ref) =>
        config.attackSourceNames.includes(ref.source_name),
      );
      if (mitreAttackReference?.external_id) {
        return true;
      }
    }
  }

  return false;
}

function removeEmptyArrays(stixObject, propertyNames) {
  for (const propertyName of propertyNames) {
    if (Array.isArray(stixObject[propertyName]) && stixObject[propertyName].length === 0) {
      delete stixObject[propertyName];
    }
  }
}

const stixOptionalArrayProperties = [
  'x_mitre_aliases',
  'x_mitre_contributors',
  'x_mitre_data_sources',
  'x_mitre_defense_bypassed',
  'x_mitre_domains',
  'x_mitre_effective_permissions',
  'x_mitre_impact_type',
  'x_mitre_related_assets',
  'x_mitre_sectors',
  'x_mitre_system_requirements',
  'x_mitre_permissions_required',
  'x_mitre_platforms',
  'x_mitre_remote_support',
  'x_mitre_tactic_type',
  'external_references',
  'kill_chain_phases',
  'aliases',
  'labels',
  'object_marking_refs',
  'roles',
  'sectors',
];
function conformToStixVersion(stixObject, stixVersion) {
  if (stixVersion === '2.0') {
    // eslint-disable-next-line no-prototype-builtins
    if (stixObject.hasOwnProperty('spec_version')) {
      stixObject.spec_version = undefined;
    }

    if (stixObject.type === 'malware') {
      // STIX 2.0 malware may not have the property is_family
      // eslint-disable-next-line no-prototype-builtins
      if (stixObject.hasOwnProperty('is_family')) {
        stixObject.is_family = undefined;
      }

      // STIX 2.0 malware must have the property labels
      stixObject.labels = ['malware'];
    }

    if (stixObject.type === 'tool') {
      // STIX 2.0 tools may not have the property is_family
      // eslint-disable-next-line no-prototype-builtins
      if (stixObject.hasOwnProperty('is_family')) {
        stixObject.is_family = undefined;
      }

      // STIX 2.0 tools must have the property labels
      stixObject.labels = ['tool'];
    }
  } else if (stixVersion === '2.1') {
    stixObject.spec_version = '2.1';

    // STIX 2.1 malware must have the property is_family
    if (stixObject.type === 'malware') {
      stixObject.is_family = stixObject.is_family ?? true;
    }
  }

  removeEmptyArrays(stixObject, stixOptionalArrayProperties);
}

exports.exportBundle = async function (options) {
  // The attackObjectMap maps attack IDs to  attack objects and is used to make the LinkById conversion
  // more efficient.
  const attackObjectMap = new Map();
  function addAttackObjectToMap(attackObject) {
    if (attackObject?.workspace.attack_id) {
      attackObjectMap.set(attackObject.workspace.attack_id, attackObject);
    }
  }

  // Create the bundle to hold the exported objects
  const bundle = {
    type: 'bundle',
    id: `bundle--${uuid.v4()}`,
    objects: [],
  };

  // STIX 2.0: The bundle must have the spec_version property
  // STIX 2.1: The bundle may not have the spec_version property
  if (options.stixVersion === '2.0') {
    bundle.spec_version = '2.0';
  }

  // Get the primary objects (objects that match the domain)

  // Build the query
  const primaryObjectsQuery = { 'stix.x_mitre_domains': options.domain };
  const matrixQuery = {};
  if (!options.includeRevoked) {
    primaryObjectsQuery['stix.revoked'] = { $in: [null, false] };
    matrixQuery['stix.revoked'] = { $in: [null, false] };
  }
  if (!options.includeDeprecated) {
    primaryObjectsQuery['stix.x_mitre_deprecated'] = { $in: [null, false] };
    matrixQuery['stix.x_mitre_deprecated'] = { $in: [null, false] };
  }
  if (typeof options.state !== 'undefined') {
    if (Array.isArray(options.state)) {
      primaryObjectsQuery['workspace.workflow.state'] = { $in: options.state };
      matrixQuery['workspace.workflow.state'] = { $in: options.state };
    } else {
      primaryObjectsQuery['workspace.workflow.state'] = options.state;
      matrixQuery['workspace.workflow.state'] = options.state;
    }
  }

  // Build the aggregation
  // - Group the documents by stix.id, sorted by stix.modified
  // - Use the first document in each group (according to the value of stix.modified)
  // - Then apply query, skip and limit options
  const aggregation = [
    { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
    { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$document' } },
    { $sort: { 'stix.id': 1 } },
    { $match: primaryObjectsQuery },
  ];

  // Retrieve the primary objects
  const domainMitigations = await Mitigation.aggregate(aggregation);
  const domainSoftware = await Software.aggregate(aggregation);
  const domainTactics = await Tactic.aggregate(aggregation);
  const domainTechniques = await Technique.aggregate(aggregation);

  // Retrieve the matrices
  const matrixAggregation = aggregation.filter((val) => !val.$match);
  matrixAggregation.push({ $match: matrixQuery });
  const allMatrices = await Matrix.aggregate(matrixAggregation);
  const domainMatrices = allMatrices.filter(
    (matrix) =>
      matrix?.stix?.external_references.length &&
      matrix.stix.external_references[0].external_id === options.domain,
  );

  let primaryObjects = [
    ...domainMatrices,
    ...domainMitigations,
    ...domainSoftware,
    ...domainTactics,
    ...domainTechniques,
  ];

  // No primary objects means that the domain doesn't exist
  // Return an empty bundle
  if (primaryObjects.length === 0) {
    return bundle;
  }

  // Remove any primary objects that don't have an ATT&CK ID
  if (!options.includeMissingAttackId) {
    primaryObjects = primaryObjects.filter((o) => hasAttackId(o));
  }

  // Put the primary objects in the bundle
  // Also create a map of the objects added to the bundle (use the id as the key, since relationships only reference the id)
  const objectsMap = new Map();
  for (const primaryObject of primaryObjects) {
    bundle.objects.push(primaryObject.stix);
    objectsMap.set(primaryObject.stix.id, true);
    addAttackObjectToMap(primaryObject);
  }

  // Get the relationships that point at primary objects (removing duplicates)

  // Get all of the relationships
  // Use the aggregation to only get the last version of each relationship and
  // filter out revoked and deprecated relationships
  const relationshipQuery = {};
  if (!options.includeRevoked) {
    relationshipQuery['stix.revoked'] = { $in: [null, false] };
  }
  if (!options.includeDeprecated) {
    relationshipQuery['stix.x_mitre_deprecated'] = { $in: [null, false] };
  }
  if (typeof options.state !== 'undefined') {
    if (Array.isArray(options.state)) {
      relationshipQuery['workspace.workflow.state'] = { $in: options.state };
    } else {
      relationshipQuery['workspace.workflow.state'] = options.state;
    }
  }
  const relationshipAggregation = [
    { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
    { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$document' } },
    { $match: relationshipQuery },
  ];
  const allRelationships = await Relationship.aggregate(relationshipAggregation);

  // Iterate over the relationships, keeping any that have a source_ref or target_ref that points at a primary object
  const primaryObjectRelationships = [];
  for (const relationship of allRelationships) {
    if (
      objectsMap.has(relationship.stix.source_ref) ||
      objectsMap.has(relationship.stix.target_ref)
    ) {
      primaryObjectRelationships.push(relationship);
    }
  }

  // function to test if an object belongs to the domain
  // Only applies to certain object types
  const domainCheckTypes = [
    'attack-pattern',
    'course-of-action',
    'malware',
    'tool',
    'x-mitre-tactic',
  ];
  function isCorrectDomain(attackObject) {
    return (
      !domainCheckTypes.includes(attackObject?.stix?.type) ||
      (attackObject?.stix?.x_mitre_domains &&
        attackObject.stix.x_mitre_domains.includes(options.domain))
    );
  }

  // function to test if a secondary object is valid and should be included in the bundle
  function secondaryObjectIsValid(secondaryObject) {
    return (
      secondaryObject &&
      (options.includeMissingAttackId ||
        !requiresAttackId(secondaryObject) ||
        hasAttackId(secondaryObject)) &&
      (options.includeDeprecated || !secondaryObject.stix.x_mitre_deprecated) &&
      (options.includeRevoked || !secondaryObject.stix.revoked) &&
      (options.state === undefined || secondaryObject.workspace.workflow.state === options.state) &&
      isCorrectDomain(secondaryObject)
    );
  }

  function relationshipIsActive(relationship) {
    // Include the source and target of inactive relationships, but don't include the relationship itself
    return !relationship.stix.x_mitre_deprecated && !relationship.stix.revoked;
  }

  // Get the secondary objects (additional objects pointed to by a relationship)
  const secondaryObjects = [];
  const dataComponents = new Map();
  for (const relationship of primaryObjectRelationships) {
    if (
      objectsMap.has(relationship.stix.source_ref) &&
      objectsMap.has(relationship.stix.target_ref)
    ) {
      // source_ref (primary) => target_ref (primary)
      if (relationshipIsActive(relationship)) {
        bundle.objects.push(relationship.stix);
      }
    } else if (
      !objectsMap.has(relationship.stix.source_ref) &&
      objectsMap.has(relationship.stix.target_ref)
    ) {
      // source_ref (secondary) => target_ref (primary)
      const secondaryObject = await getAttackObject(relationship.stix.source_ref);
      if (secondaryObjectIsValid(secondaryObject)) {
        secondaryObjects.push(secondaryObject);
        objectsMap.set(secondaryObject.stix.id, true);
        if (relationshipIsActive(relationship)) {
          bundle.objects.push(relationship.stix);
        }
      }

      // Save data components for later
      if (relationship.stix.relationship_type === 'detects') {
        dataComponents.set(secondaryObject.stix.id, secondaryObject.stix);
      }
    } else if (
      objectsMap.has(relationship.stix.source_ref) &&
      !objectsMap.has(relationship.stix.target_ref)
    ) {
      // source_ref (primary) => target_ref (secondary)
      const secondaryObject = await getAttackObject(relationship.stix.target_ref);
      if (secondaryObjectIsValid(secondaryObject)) {
        secondaryObjects.push(secondaryObject);
        objectsMap.set(secondaryObject.stix.id, true);
        if (relationshipIsActive(relationship)) {
          bundle.objects.push(relationship.stix);
        }
      }
    }
  }

  // Secondary object domains are the union of the related primary object domains
  // Do not include primary objects when the relationship is deprecated
  async function domainsForSecondaryObject(attackObject) {
    const objectRelationships = allRelationships.filter(
      (r) => r.stix.source_ref === attackObject.stix.id,
    );
    const domainMap = new Map();
    for (const relationship of objectRelationships) {
      const targetObject = await getAttackObject(relationship.stix.target_ref);
      if (targetObject?.stix.x_mitre_domains) {
        for (const domain of targetObject.stix.x_mitre_domains) {
          domainMap.set(domain, true);
        }
      }
    }

    return [...domainMap.keys()];
  }

  // Put the secondary objects in the bundle
  for (const secondaryObject of secondaryObjects) {
    // Groups and campaigns need to have the domain added to x_mitre_domains
    if (secondaryObject.stix.type === 'intrusion-set' || secondaryObject.stix.type === 'campaign') {
      secondaryObject.stix.x_mitre_domains = await domainsForSecondaryObject(secondaryObject);
    }
    bundle.objects.push(secondaryObject.stix);
    addAttackObjectToMap(secondaryObject);
  }

  // Add groups to the bundle that are referenced by a campaign but are not referenced by a primary object
  for (const relationship of allRelationships) {
    if (relationship.stix.relationship_type === 'attributed-to') {
      if (
        objectsMap.has(relationship.stix.source_ref) &&
        !objectsMap.has(relationship.stix.target_ref)
      ) {
        // Add the group to the bundle
        const groupObject = await getAttackObject(relationship.stix.target_ref);
        if (groupObject.stix.type === 'intrusion-set' && secondaryObjectIsValid(groupObject)) {
          groupObject.stix.x_mitre_domains = [options.domain];
          bundle.objects.push(groupObject.stix);
          objectsMap.set(groupObject.stix.id, true);
          // relationships will be added to the bundle later
        }
      }
    }
  }

  // Data components have already been added to the bundle because they're referenced in a relationship
  // Get the data sources referenced by data components, using a map to eliminate duplicates
  const dataSourceIds = new Map();
  for (const bundleObject of bundle.objects) {
    if (bundleObject.type === 'x-mitre-data-component') {
      dataSourceIds.set(bundleObject.x_mitre_data_source_ref, true);
    }
  }

  // Retrieve the data sources, add to bundle, and save for deriving x_mitre_data_sources
  const dataSources = new Map();
  for (const dataSourceId of dataSourceIds.keys()) {
    const dataSource = await getAttackObject(dataSourceId);
    if (secondaryObjectIsValid(dataSource)) {
      bundle.objects.push(dataSource.stix);
      dataSources.set(dataSourceId, dataSource.stix);
      addAttackObjectToMap(dataSource);
    }
  }

  // Add secondary objects that were revoked-by other secondary objects
  //   It's possible that a revoked object is not referenced in a relationship to a primary object
  //   Include it if the object that revoked it is already included
  for (const relationship of allRelationships) {
    if (relationship.stix.relationship_type === 'revoked-by') {
      if (
        !objectsMap.has(relationship.stix.source_ref) &&
        objectsMap.has(relationship.stix.target_ref)
      ) {
        const revokedObject = await getAttackObject(relationship.stix.source_ref);
        if (secondaryObjectIsValid(revokedObject)) {
          if (
            revokedObject.stix.type === 'intrusion-set' ||
            revokedObject.stix.type === 'campaign'
          ) {
            revokedObject.stix.x_mitre_domains = [options.domain];
          }
          bundle.objects.push(revokedObject.stix);
          addAttackObjectToMap(revokedObject);
          objectsMap.set(revokedObject.stix.id, true);
        }
      }
    }
  }

  // Create a map of techniques detected by data components
  // key = technique id, value = array of data component refs
  const techniqueDetectedBy = new Map();
  for (const relationship of primaryObjectRelationships) {
    if (relationship.stix.relationship_type === 'detects' && relationshipIsActive(relationship)) {
      // technique (target_ref) detected by array of data-component (source_ref)
      const techniqueDataComponents = techniqueDetectedBy.get(relationship.stix.target_ref);
      if (techniqueDataComponents) {
        // Add to the existing array
        techniqueDataComponents.push(relationship.stix.source_ref);
      } else {
        // Create a new array and add to map
        techniqueDetectedBy.set(relationship.stix.target_ref, [relationship.stix.source_ref]);
      }
    }
  }

  // Supplement techniques with x_mitre_data_sources for backwards compatibility
  // Also make sure that all techniques have x_mitre_is_subtechnique set
  for (const bundleObject of bundle.objects) {
    if (bundleObject.type === 'attack-pattern') {
      // Make sure that x_mitre_is_subtechnique is set
      bundleObject.x_mitre_is_subtechnique = bundleObject.x_mitre_is_subtechnique ?? false;

      const enterpriseDomain = bundleObject.x_mitre_domains.includes('enterprise-attack');
      const icsDomain = bundleObject.x_mitre_domains.includes('ics-attack');
      if (enterpriseDomain || icsDomain) {
        // Remove any existing data source string entries
        bundleObject.x_mitre_data_sources = [];

        // Add data source string entries based on the data sources associated with the technique
        //   data component detects technique AND data component refers to data source
        const dataComponentIds = techniqueDetectedBy.get(bundleObject.id);
        if (dataComponentIds) {
          for (const dataComponentId of dataComponentIds) {
            const dataComponent = dataComponents.get(dataComponentId);
            if (dataComponent) {
              const dataSourceForTechnique = dataSources.get(dataComponent.x_mitre_data_source_ref);
              if (dataSourceForTechnique) {
                const derivedDataSource = `${dataSourceForTechnique.name}: ${dataComponent.name}`;
                bundleObject.x_mitre_data_sources.push(derivedDataSource);
              } else {
                console.log(
                  `Referenced data source not found: ${dataComponent.x_mitre_data_source_ref}`,
                );
              }
            } else {
              console.log(`Referenced data component not found: ${dataComponentId}`);
            }
          }
        }
      } else {
        // Remove any existing data sources
        bundleObject.x_mitre_data_sources = [];
      }
    }
  }

  // Create a map of relationship ids
  const relationshipsMap = new Map();
  for (const relationship of primaryObjectRelationships) {
    relationshipsMap.set(relationship.stix.id, true);
  }

  // Add secondary object-to-secondary object revoked-by relationships
  // (any revoked-by relationship for a primary object should already be included)
  for (const relationship of allRelationships) {
    if (
      relationship.stix.relationship_type === 'revoked-by' &&
      !relationshipsMap.has(relationship.stix.id) &&
      objectsMap.has(relationship.stix.source_ref) &&
      objectsMap.has(relationship.stix.target_ref)
    ) {
      if (relationshipIsActive(relationship)) {
        bundle.objects.push(relationship.stix);
        relationshipsMap.set(relationship.stix.id, true);
      }
    }
  }

  // Add campaign-to-group attributed-to relationships
  // (campaigns and groups are secondary objects, so an attributed-to relationship will not be added yet)
  for (const relationship of allRelationships) {
    if (
      relationship.stix.relationship_type === 'attributed-to' &&
      !relationshipsMap.has(relationship.stix.id) &&
      objectsMap.has(relationship.stix.source_ref) &&
      objectsMap.has(relationship.stix.target_ref)
    ) {
      if (relationshipIsActive(relationship)) {
        bundle.objects.push(relationship.stix);
        relationshipsMap.set(relationship.stix.id, true);
      }
    }
  }

  if (options.includeNotes) {
    // Get any note that references an object in the bundle
    // Start by getting all notes
    const allNotes = await Note.aggregate(relationshipAggregation);

    // Iterate over the notes, keeping any that have an object_ref that points at an object in the bundle
    const notes = [];
    for (const note of allNotes) {
      if (Array.isArray(note?.stix?.object_refs)) {
        let includeNote = false;
        for (const objectRef of note.stix.object_refs) {
          if (objectsMap.has(objectRef) || relationshipsMap.has(objectRef)) {
            includeNote = true;
            break;
          }
        }
        if (includeNote) {
          notes.push(note);
        }
      }
    }

    // Put the notes in the bundle
    for (const note of notes) {
      bundle.objects.push(note.stix);
    }
  }

  // Create the function to be used by the LinkById conversion process
  // Note that using this map instead of database retrieval results in a
  // dramatic performance improvement.
  const getAttackObjectFromMap = async function (attackId) {
    let attackObject = attackObjectMap.get(attackId);
    if (!attackObject) {
      attackObject = await linkById.getAttackObjectFromDatabase(attackId);
    }
    return attackObject;
  };

  // Convert LinkById tags into markdown citations
  for (const attackObject of bundle.objects) {
    await linkById.convertLinkByIdTags(attackObject, getAttackObjectFromMap);
  }

  // Make a list of identities referenced
  const identitiesMap = new Map();
  for (const bundleObject of bundle.objects) {
    if (bundleObject.created_by_ref) {
      identitiesMap.set(bundleObject.created_by_ref, true);
    }
  }

  // Make a list of marking definitions referenced
  const markingDefinitionsMap = new Map();
  for (const bundleObject of bundle.objects) {
    if (bundleObject.object_marking_refs) {
      for (const markingRef of bundleObject.object_marking_refs) {
        markingDefinitionsMap.set(markingRef, true);
      }
    }
  }

  for (const stixId of identitiesMap.keys()) {
    const identity = await getAttackObject(stixId);
    if (secondaryObjectIsValid(identity)) {
      bundle.objects.push(identity.stix);
    } else {
      console.log(`Referenced identity not found: ${stixId}`);
    }
  }

  for (const stixId of markingDefinitionsMap.keys()) {
    const markingDefinition = await getAttackObject(stixId);
    if (secondaryObjectIsValid(markingDefinition)) {
      bundle.objects.push(markingDefinition.stix);
    }
  }

  // Modify the bundle objects to conform to the selected STIX version
  for (const stixObject of bundle.objects) {
    conformToStixVersion(stixObject, options.stixVersion);
  }

  // Verify that there are no relationships with orphaned references
  for (const stixObject of bundle.objects) {
    if (stixObject.type === 'relationship') {
      if (!objectsMap.has(stixObject.source_ref)) {
        console.warn(
          `source_ref not found ${stixObject.source_ref} ${stixObject.relationship_type} ${stixObject.target_ref}`,
        );
      }
      if (!objectsMap.has(stixObject.target_ref)) {
        console.warn(
          `target_ref not found ${stixObject.source_ref} ${stixObject.relationship_type} ${stixObject.target_ref}`,
        );
      }
    }
  }

  // TBD: A marking definition can contain a created_by_ref
  // and an identity can contain a marking definition.
  // An unlikely edge case is for one of those to reference
  // an object that hasn't been loaded by any other object.

  return bundle;
};
