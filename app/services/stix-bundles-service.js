'use strict';

const uuid = require('uuid');
const config = require('../config/config');
const BaseService = require('./_base.service');
const linkById = require('../lib/linkById');
const logger = require('../lib/logger');

// Import repositories
const attackObjectsRepository = require('../repository/attack-objects-repository');
const matrixRepository = require('../repository/matrix-repository');
const mitigationsRepository = require('../repository/mitigations-repository');
const notesRepository = require('../repository/notes-repository');
const relationshipsRepository = require('../repository/relationships-repository');
const softwareRepository = require('../repository/software-repository');
const tacticsRepository = require('../repository/tactics-repository');
const techniquesRepository = require('../repository/techniques-repository');

// Import services
const notesService = require('./notes-service');

/**
 * Service for generating STIX bundles from the ATT&CK database.
 *
 * CORE CONCEPTS:
 *
 * This service makes an important distinction between "primary" and "secondary" objects
 * when generating STIX bundles:
 *
 * PRIMARY OBJECTS:
 * - Objects that directly belong to the requested domain (e.g., enterprise-attack, mobile-attack)
 * - These are retrieved in the initial database query
 * - Examples for enterprise-attack domain:
 *   * Techniques like "Process Injection"
 *   * Tactics like "Persistence"
 *   * Mitigations specific to enterprise
 *   * Software/Tools used in enterprise attacks
 *
 * SECONDARY OBJECTS:
 * - Objects that are related to primary objects through relationships
 * - Not part of the initial domain query but may need to be included
 * - Need to be validated before inclusion in the bundle
 * - Examples:
 *   * A threat group that uses an enterprise technique
 *   * A campaign that deploys enterprise malware
 *
 * EXAMPLE SCENARIO:
 * When requesting enterprise-attack domain bundle:
 * 1. Primary Objects (from initial query):
 *    - Technique T1055 "Process Injection"
 *    - Technique T1056 "Input Capture"
 *
 * 2. Relationships discovered:
 *    - Group G0096 uses Technique T1055
 *    - Malware S0002 uses Technique T1056
 *
 * 3. Secondary Objects (need validation):
 *    - Group G0096
 *    - Malware S0002
 *
 * The complex relationship processing in this service handles:
 * 1. Primary → Primary relationships (simplest case)
 * 2. Primary → Secondary relationships (need to fetch/validate secondary)
 * 3. Secondary → Primary relationships (need to fetch/validate secondary)
 * 4. Special cases like 'detects' relationships
 */
class StixBundlesService extends BaseService {
  /**
   * Initializes the STIX Bundles Service with necessary repositories and caches.
   * Sets up caching mechanisms for attack objects, identities, and marking definitions
   * to optimize performance during bundle generation.
   */
  constructor() {
    super();
    this.repositories = {
      attackObject: attackObjectsRepository,
      matrix: matrixRepository,
      mitigation: mitigationsRepository,
      note: notesRepository,
      relationship: relationshipsRepository,
      software: softwareRepository,
      tactic: tacticsRepository,
      technique: techniquesRepository,
    };

    // Initialize caches for efficient object lookup
    this.attackObjectCache = new Map(); // Maps STIX IDs to attack objects
    this.identityCache = new Map(); // Maps identity STIX IDs to identity objects
    this.markingDefinitionsCache = new Map(); // Maps marking definition STIX IDs to marking objects
    this.attackObjectByAttackIdCache = new Map(); // Maps attack IDs to attack objects
  }

  // ============================
  // Domain and Type Validation
  // ============================

  /**
   * Validates if an attack object belongs to the specified domain.
   * Only certain object types require domain validation.
   * @param {Object} attackObject - The attack object to validate
   * @param {string} domain - The domain to check against
   * @returns {boolean} True if object belongs to domain or doesn't require domain validation
   */
  static isCorrectDomain(attackObject, domain) {
    const domainCheckTypes = [
      'attack-pattern',
      'course-of-action',
      'malware',
      'tool',
      'x-mitre-tactic',
    ];

    return (
      !domainCheckTypes.includes(attackObject?.stix?.type) ||
      (attackObject?.stix?.x_mitre_domains && attackObject.stix.x_mitre_domains.includes(domain))
    );
  }

  /**
   * Checks if an attack object has a valid ATT&CK ID in its external references.
   * @param {Object} attackObject - The attack object to check
   * @returns {boolean} True if the object has a valid ATT&CK ID
   */
  static hasAttackId(attackObject) {
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

  /**
   * Determines if a given attack object type requires an ATT&CK ID.
   * @param {Object} attackObject - The attack object to check
   * @returns {boolean} True if the object type requires an ATT&CK ID
   */
  static requiresAttackId(attackObject) {
    const attackIdObjectTypes = [
      'intrusion-set',
      'campaign',
      'malware',
      'tool',
      'attack-pattern',
      'course-of-action',
      'x-mitre-data_source',
    ];
    return attackIdObjectTypes.includes(attackObject?.stix?.type);
  }

  // ============================
  // STIX Version Management
  // ============================

  /**
   * Removes empty array properties from a STIX object.
   * @param {Object} stixObject - The STIX object to clean
   * @param {Array<string>} propertyNames - Array of property names to check
   */
  static removeEmptyArrays(stixObject, propertyNames) {
    for (const propertyName of propertyNames) {
      if (Array.isArray(stixObject[propertyName]) && stixObject[propertyName].length === 0) {
        delete stixObject[propertyName];
      }
    }
  }

  /**
   * Modifies a STIX object to conform to the specified STIX version (2.0 or 2.1).
   * Handles version-specific requirements for various object types.
   * @param {Object} stixObject - The STIX object to modify
   * @param {string} stixVersion - The target STIX version ('2.0' or '2.1')
   */
  static conformToStixVersion(stixObject, stixVersion) {
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

    if (stixVersion === '2.0') {
      // Remove STIX 2.1 specific properties
      if (Object.prototype.hasOwnProperty.call(stixObject, 'spec_version')) {
        stixObject.spec_version = undefined;
      }

      // Handle malware and tool specific requirements
      if (stixObject.type === 'malware') {
        if (Object.prototype.hasOwnProperty.call(stixObject, 'is_family')) {
          stixObject.is_family = undefined;
        }
        stixObject.labels = ['malware'];
      }

      if (stixObject.type === 'tool') {
        if (Object.prototype.hasOwnProperty.call(stixObject, 'is_family')) {
          stixObject.is_family = undefined;
        }
        stixObject.labels = ['tool'];
      }
    } else if (stixVersion === '2.1') {
      stixObject.spec_version = '2.1';

      // Handle STIX 2.1 specific requirements
      if (stixObject.type === 'malware') {
        stixObject.is_family = stixObject.is_family ?? true;
      }
    }

    this.removeEmptyArrays(stixObject, stixOptionalArrayProperties);
  }

  // ============================
  // Relationship Management
  // ============================

  /**
   * Determines if a relationship is currently active (not deprecated or revoked).
   * @param {Object} relationship - The relationship object to check
   * @returns {boolean} True if the relationship is active
   */
  static relationshipIsActive(relationship) {
    return !relationship.stix.x_mitre_deprecated && !relationship.stix.revoked;
  }

  /**
   * Processes a secondary object for inclusion in the bundle.
   * Validates the object and updates necessary data structures.
   * @param {Object} secondaryObject - The secondary object to process
   * @param {Object} options - Bundle generation options
   * @param {Map} objectsMap - Map tracking objects in the bundle
   * @returns {Promise<boolean>} True if object was successfully processed
   */
  async processSecondaryObject(secondaryObject, options, objectsMap) {
    if (!StixBundlesService.secondaryObjectIsValid(secondaryObject, options)) {
      return false;
    }

    // Handle domains for groups and campaigns
    if (secondaryObject.stix.type === 'intrusion-set' || secondaryObject.stix.type === 'campaign') {
      secondaryObject.stix.x_mitre_domains =
        await this.getDomainsForSecondaryObject(secondaryObject);
    }

    objectsMap.set(secondaryObject.stix.id, true);
    const attackId = linkById.getAttackId(secondaryObject.stix);
    if (attackId) {
      this.attackObjectByAttackIdCache.set(attackId, secondaryObject);
    }
    return true;
  }

  /**
   * Validates if a secondary object meets all inclusion criteria for the bundle.
   * @param {Object} secondaryObject - The object to validate
   * @param {Object} options - Bundle generation options
   * @returns {boolean} True if the object meets all inclusion criteria
   */
  static secondaryObjectIsValid(secondaryObject, options) {
    return (
      // Object must exist
      secondaryObject &&
      // Check if ATT&CK ID is required
      (options.includeMissingAttackId ||
        !StixBundlesService.requiresAttackId(secondaryObject) ||
        StixBundlesService.hasAttackId(secondaryObject)) &&
      // Check deprecation status
      (options.includeDeprecated || !secondaryObject.stix.x_mitre_deprecated) &&
      // Check revocation status
      (options.includeRevoked || !secondaryObject.stix.revoked) &&
      // Check workflow state if specified
      (options.state === undefined || secondaryObject.workspace.workflow.state === options.state) &&
      // Verify domain for certain object types
      StixBundlesService.isCorrectDomain(secondaryObject, options.domain)
    );
  }

  /**
   * Determines the domains associated with a secondary object based on its relationships.
   * @param {Object} attackObject - The secondary object to process
   * @returns {Promise<Array<string>>} Array of domain names
   */
  async getDomainsForSecondaryObject(attackObject) {
    const relationships = this.allRelationships.filter(
      (relationship) => relationship.stix.source_ref == attackObject.stix.id,
    );

    const domainMap = new Map();
    for (const relationship of relationships) {
      const targetObject = await this.getAttackObject(relationship.stix.target_ref);
      if (targetObject?.stix.x_mitre_domains) {
        for (const domain of targetObject.stix.x_mitre_domains) {
          domainMap.set(domain, true);
        }
      }
    }

    return [...domainMap.keys()];
  }

  // ============================
  // Data Component Management
  // ============================

  /**
   * Updates technique objects with data component detection information.
   * @param {Object} bundle - The STIX bundle being built
   * @param {Map} techniqueDetectedBy - Map of techniques to their detecting components
   * @param {Map} dataComponents - Map of data component IDs to objects
   * @param {Map} dataSources - Map of data source IDs to objects
   */
  static processDataComponents(bundle, techniqueDetectedBy, dataComponents, dataSources) {
    for (const bundleObject of bundle.objects) {
      if (bundleObject.type === 'attack-pattern') {
        bundleObject.x_mitre_is_subtechnique = bundleObject.x_mitre_is_subtechnique ?? false;

        const enterpriseDomain = bundleObject.x_mitre_domains.includes('enterprise-attack');
        const icsDomain = bundleObject.x_mitre_domains.includes('ics-attack');

        if (enterpriseDomain || icsDomain) {
          StixBundlesService.addDerivedDataSources(
            bundleObject,
            techniqueDetectedBy,
            dataComponents,
            dataSources,
          );
        } else {
          bundleObject.x_mitre_data_sources = [];
        }
      }
    }
  }

  /**
   * Adds derived data sources to a technique based on its detecting components.
   * @param {Object} bundleObject - The technique object to update
   * @param {Map} techniqueDetectedBy - Map of techniques to their detecting components
   * @param {Map} dataComponents - Map of data component IDs to objects
   * @param {Map} dataSources - Map of data source IDs to objects
   */
  static addDerivedDataSources(bundleObject, techniqueDetectedBy, dataComponents, dataSources) {
    bundleObject.x_mitre_data_sources = [];

    const dataComponentIds = techniqueDetectedBy.get(bundleObject.id);
    if (!dataComponentIds) return;

    for (const dataComponentId of dataComponentIds) {
      const dataComponent = dataComponents.get(dataComponentId);
      if (!dataComponent) {
        logger.warn(`Referenced data component not found: ${dataComponentId}`);
        continue;
      }

      const dataSource = dataSources.get(dataComponent.x_mitre_data_source_ref);
      if (!dataSource) {
        logger.warn(`Referenced data source not found: ${dataComponent.x_mitre_data_source_ref}`);
        continue;
      }

      const derivedDataSource = `${dataSource.name}: ${dataComponent.name}`;
      bundleObject.x_mitre_data_sources.push(derivedDataSource);
    }
  }

  // ============================
  // Main Export Method
  // ============================

  /**
   * Main method for exporting a STIX bundle with specified options.
   * Orchestrates the entire bundle generation process including:
   * - Retrieving primary objects from specified domain
   * - Processing relationships between objects
   * - Adding secondary objects and their relationships
   * - Handling data components and data sources
   * - Processing notes if requested
   * - Conforming objects to specified STIX version
   *
   * @param {Object} options - Bundle generation options
   * @param {string} options.domain - The domain to generate bundle for (e.g., 'enterprise-attack')
   * @param {string} options.stixVersion - Target STIX version ('2.0' or '2.1')
   * @param {boolean} options.includeRevoked - Whether to include revoked objects
   * @param {boolean} options.includeDeprecated - Whether to include deprecated objects
   * @param {boolean} options.includeMissingAttackId - Whether to include objects without ATT&CK IDs
   * @param {boolean} options.includeNotes - Whether to include associated notes
   * @param {string} [options.state] - Workflow state filter
   * @returns {Promise<Object>} The generated STIX bundle
   */
  async exportBundle(options) {
    // Initialize bundle
    const bundle = {
      type: 'bundle',
      id: `bundle--${uuid.v4()}`,
      objects: [],
    };

    // STIX version handling:
    // - STIX 2.0: Bundle must have spec_version property
    // - STIX 2.1: Bundle must not have spec_version property
    if (options.stixVersion === '2.0') {
      bundle.spec_version = '2.0';
    }

    // Build query options
    const queryOptions = {
      includeRevoked: options.includeRevoked,
      includeDeprecated: options.includeDeprecated,
      state: options.state,
      domain: options.domain,
    };

    // Retrieve primary objects
    // Note: Matrix retrieval differs from other objects:
    // 1. Other objects: Filtered by domain in database using stix.x_mitre_domains field
    // 2. Matrices: Retrieved without domain filter, then filtered by external_references[0].external_id
    const [
      domainMitigations,
      domainSoftware,
      domainTactics,
      domainTechniques,
      allMatrices, // All matrices regardless of domain
    ] = await Promise.all([
      mitigationsRepository.retrieveAllByDomain(options.domain, queryOptions),
      softwareRepository.retrieveAllByDomain(options.domain, queryOptions),
      tacticsRepository.retrieveAllByDomain(options.domain, queryOptions),
      techniquesRepository.retrieveAllByDomain(options.domain, queryOptions),
      matrixRepository.retrieveAllForBundle(queryOptions), // Special matrix handling
    ]);

    // Filter matrices by domain
    // Unlike other objects where domain filtering happened in the database query,
    // we filter matrices here by checking their external_references.
    // This preserves the original logic where matrices are associated with domains
    // via external_references[0].external_id rather than the x_mitre_domains field.
    const domainMatrices = allMatrices.filter(
      (matrix) =>
        matrix?.stix?.external_references?.length &&
        matrix.stix.external_references[0].external_id === options.domain,
    );

    let primaryObjects = [
      ...domainMatrices,
      ...domainMitigations,
      ...domainSoftware,
      ...domainTactics,
      ...domainTechniques,
    ];

    if (primaryObjects.length === 0) {
      return bundle;
    }

    if (!options.includeMissingAttackId) {
      primaryObjects = primaryObjects.filter((o) => StixBundlesService.hasAttackId(o));
    }

    // Put the primary objects in the bundle
    // Also create a map of the objects added to the bundle (use the id as the key, since relationships only reference the id)
    const objectsMap = new Map();
    for (const primaryObject of primaryObjects) {
      bundle.objects.push(primaryObject.stix);
      objectsMap.set(primaryObject.stix.id, true);
      const attackId = linkById.getAttackId(primaryObject.stix);
      if (attackId) {
        this.attackObjectByAttackIdCache.set(attackId, primaryObject);
      }
    }

    // Get the relationships that point at primary objects (removing duplicates)
    // Remove domain from options for relationships
    const relationshipOptions = {
      includeRevoked: options.includeRevoked,
      includeDeprecated: options.includeDeprecated,
      state: options.state,
    };
    // Since we're querying all relationships, save them for later to prevent future database queries.
    this.allRelationships = await relationshipsRepository.retrieveAllForBundle(relationshipOptions);

    // Iterate over the relationships, keeping any that have a source_ref or target_ref that points at a primary object
    const primaryObjectRelationships = this.allRelationships.filter(
      (relationship) =>
        objectsMap.has(relationship.stix.source_ref) ||
        objectsMap.has(relationship.stix.target_ref),
    );

    // Get the secondary objects (additional objects pointed to by a relationship)
    const secondaryObjects = [];
    const dataComponents = new Map();
    for (const relationship of primaryObjectRelationships) {
      await this.processRelationship(
        relationship,
        objectsMap,
        secondaryObjects,
        dataComponents,
        bundle,
        options,
      );
    }

    // Process data sources and components
    const techniqueDetectedBy = new Map();
    StixBundlesService.buildTechniqueDetectionMap(primaryObjectRelationships, techniqueDetectedBy);

    const dataSources = new Map();
    await this.processDataSourcesAndComponents(bundle, dataComponents, dataSources, options);

    await this.processSecondaryRelationships(bundle, objectsMap, options);

    // Process data components
    StixBundlesService.processDataComponents(
      bundle,
      techniqueDetectedBy,
      dataComponents,
      dataSources,
    );

    // Add notes if requested
    if (options.includeNotes) {
      // Get any note that references an object in the bundle
      await notesService.addNotes(bundle.objects);
    }

    // Convert LinkById tags to markdown citations
    for (const bundleObject of bundle.objects) {
      await linkById.convertLinkByIdTags(bundleObject, this.getAttackObjectFromMap);
    }

    // Process identities and marking definitions
    await this.processIdentitiesAndMarkings(bundle);

    // Conform to STIX version
    for (const stixObject of bundle.objects) {
      StixBundlesService.conformToStixVersion(stixObject, options.stixVersion);
    }

    // Validate relationships
    StixBundlesService.validateRelationships(bundle.objects, objectsMap);

    return bundle;
  }

  /**
   * Main method for processing a single STIX relationship.
   * This is a critical part of the bundle generation process that handles three main cases:
   *
   * 1. Primary → Primary relationships (both objects already in bundle)
   * 2. Secondary → Primary relationships (source needs to be fetched)
   * 3. Primary → Secondary relationships (target needs to be fetched)
   *
   * Special handling is provided for 'detects' relationships to support
   * technique detection data processing.
   *
   * @param {Object} relationship - The relationship to process
   * @param {Map} objectsMap - Map of objects currently in the bundle
   * @param {Array} secondaryObjects - Array to collect secondary objects
   * @param {Map} dataComponents - Map to collect data components
   * @param {Object} bundle - The STIX bundle being built
   * @param {Object} options - Bundle generation options
   * @returns {Promise<void>}
   */
  async processRelationship(
    relationship,
    objectsMap,
    secondaryObjects,
    dataComponents,
    bundle,
    options,
  ) {
    // Case 1: Both objects are primary (already in our bundle)
    if (StixBundlesService.isSourceTargetPrimary(relationship, objectsMap)) {
      // For primary-to-primary relationships, we only need to add the
      // relationship itself if it's active
      if (StixBundlesService.relationshipIsActive(relationship)) {
        bundle.objects.push(relationship.stix);
      }
    }
    // Case 2: Source is secondary (needs to be fetched), target is primary
    else if (StixBundlesService.isSourceSecondaryTargetPrimary(relationship, objectsMap)) {
      const secondaryObject = await this.getAttackObject(relationship.stix.source_ref);

      // Only process if the secondary object meets our inclusion criteria
      if (await this.processSecondaryObject(secondaryObject, options, objectsMap)) {
        secondaryObjects.push(secondaryObject);
        bundle.objects.push(secondaryObject.stix);

        // Add the relationship if it's active
        if (StixBundlesService.relationshipIsActive(relationship)) {
          bundle.objects.push(relationship.stix);
        }
      }

      // Special handling for 'detects' relationships:
      // Track data components for later processing of technique detection data
      if (relationship.stix.relationship_type === 'detects') {
        dataComponents.set(secondaryObject.stix.id, secondaryObject.stix);
      }
    }
    // Case 3: Source is primary, target is secondary (needs to be fetched)
    else if (StixBundlesService.isSourcePrimaryTargetSecondary(relationship, objectsMap)) {
      const secondaryObject = await this.getAttackObject(relationship.stix.target_ref);

      // Only process if the secondary object meets our inclusion criteria
      if (await this.processSecondaryObject(secondaryObject, options, objectsMap)) {
        secondaryObjects.push(secondaryObject);
        bundle.objects.push(secondaryObject.stix);

        // Add the relationship if it's active
        if (StixBundlesService.relationshipIsActive(relationship)) {
          bundle.objects.push(relationship.stix);
        }
      }
    }
  }

  /**
   * Determines if a relationship connects two primary objects (both already in our bundle)
   */
  static isSourceTargetPrimary(relationship, objectsMap) {
    return (
      objectsMap.has(relationship.stix.source_ref) && objectsMap.has(relationship.stix.target_ref)
    );
  }

  /**
   * Determines if a relationship connects a secondary source to a primary target
   * This means we have the target object but need to fetch and validate the source
   */
  static isSourceSecondaryTargetPrimary(relationship, objectsMap) {
    return (
      !objectsMap.has(relationship.stix.source_ref) && objectsMap.has(relationship.stix.target_ref)
    );
  }

  /**
   * Determines if a relationship connects a primary source to a secondary target
   * This means we have the source object but need to fetch and validate the target
   */
  static isSourcePrimaryTargetSecondary(relationship, objectsMap) {
    return (
      objectsMap.has(relationship.stix.source_ref) && !objectsMap.has(relationship.stix.target_ref)
    );
  }

  /**
   * Builds a mapping of which techniques are detected by which data components.
   * Used to support the derivation of data sources for techniques in the bundle.
   * Only considers active 'detects' relationships.
   *
   * @param {Array<Object>} relationships - The relationships to process
   * @param {Map} techniqueDetectedBy - Map to populate with technique detection info
   */
  static buildTechniqueDetectionMap(relationships, techniqueDetectedBy) {
    for (const relationship of relationships) {
      if (
        relationship.stix.relationship_type === 'detects' &&
        StixBundlesService.relationshipIsActive(relationship)
      ) {
        const techniqueDataComponents = techniqueDetectedBy.get(relationship.stix.target_ref);
        if (techniqueDataComponents) {
          techniqueDataComponents.push(relationship.stix.source_ref);
        } else {
          techniqueDetectedBy.set(relationship.stix.target_ref, [relationship.stix.source_ref]);
        }
      }
    }
  }

  /**
   * Processes all data sources referenced by data components in the bundle.
   * Ensures that all necessary data sources are included and properly linked.
   *
   * Steps:
   * 1. Collects all data source references from components
   * 2. Retrieves and validates each data source
   * 3. Adds valid data sources to bundle and tracking structures
   *
   * @param {Object} bundle - The STIX bundle being built
   * @param {Map} dataComponents - Map of data component objects
   * @param {Map} dataSources - Map to populate with data source objects
   * @param {Object} options - Bundle generation options
   * @returns {Promise<void>}
   */

  async processDataSourcesAndComponents(bundle, dataComponents, dataSources, options) {
    // Get data source IDs from components
    const dataSourceIds = new Map();
    for (const bundleObject of bundle.objects) {
      if (bundleObject.type === 'x-mitre-data-component') {
        dataSourceIds.set(bundleObject.x_mitre_data_source_ref, true);
      }
    }

    // Retrieve and process data sources
    for (const dataSourceId of dataSourceIds.keys()) {
      const dataSource = await this.getAttackObject(dataSourceId);
      if (StixBundlesService.secondaryObjectIsValid(dataSource, options)) {
        bundle.objects.push(dataSource.stix);
        dataSources.set(dataSourceId, dataSource.stix);
      }
    }
  }

  /**
   * Processes all identities and marking definitions referenced in the bundle.
   * This ensures that all necessary context objects are included.
   *
   * Steps:
   * 1. Collect all identity references (created_by_ref)
   * 2. Collect all marking definition references (object_marking_refs)
   * 3. Retrieve objects from cache or database
   * 4. Add valid objects to bundle
   * 5. Log warnings for missing references
   *
   * @param {Object} bundle - The STIX bundle being built
   * @returns {Promise<void>}
   */
  async processIdentitiesAndMarkings(bundle) {
    // Map referenced identities and marking definitions
    const identitiesMap = new Map();
    const markingDefinitionsMap = new Map();

    for (const bundleObject of bundle.objects) {
      if (bundleObject.created_by_ref) {
        identitiesMap.set(bundleObject.created_by_ref, true);
      }

      if (bundleObject.object_marking_refs) {
        for (const markingRef of bundleObject.object_marking_refs) {
          markingDefinitionsMap.set(markingRef, true);
        }
      }
    }

    // Process identities
    for (const stixId of identitiesMap.keys()) {
      if (this.identityCache.has(stixId)) {
        bundle.objects.push(this.identityCache.get(stixId));
        continue;
      }

      const identity = await this.getAttackObject(stixId);
      if (identity) {
        bundle.objects.push(identity.stix);
        this.identityCache.set(stixId, identity.stix);
      } else {
        logger.warn(`Referenced identity not found: ${stixId}`);
      }
    }

    // Process marking definitions
    for (const stixId of markingDefinitionsMap.keys()) {
      if (this.markingDefinitionsCache.has(stixId)) {
        bundle.objects.push(this.markingDefinitionsCache.get(stixId));
        continue;
      }

      const markingDefinition = await this.getAttackObject(stixId);
      if (markingDefinition) {
        bundle.objects.push(markingDefinition.stix);
        this.markingDefinitionsCache.set(stixId, markingDefinition.stix);
      }
    }
  }

  /**
   * Processes relationships between secondary objects and handles special cases that need separate processing:
   * - Groups referenced by campaigns through 'attributed-to' relationships
   * - Revoked-by relationships between objects already in the bundle
   * - Secondary objects that were revoked by other secondary objects
   * - Campaign-to-group attributed-to relationships where both objects are in bundle
   *
   * @param {Object} bundle - The STIX bundle being built
   * @param {Map} objectsMap - Map tracking objects currently in bundle
   * @param {Object} options - Bundle generation options
   * @param {string} options.domain - The domain being processed
   * @returns {Promise<void>}
   */
  async processSecondaryRelationships(bundle, objectsMap, options) {
    const relationshipsMap = new Map();

    // Handle groups referenced by campaigns
    for (const relationship of this.allRelationships) {
      if (relationship.stix.relationship_type === 'attributed-to') {
        if (
          objectsMap.has(relationship.stix.source_ref) &&
          !objectsMap.has(relationship.stix.target_ref)
        ) {
          const groupObject = await this.getAttackObject(relationship.stix.target_ref);
          if (
            groupObject?.stix?.type === 'intrusion-set' &&
            StixBundlesService.secondaryObjectIsValid(groupObject, options)
          ) {
            groupObject.stix.x_mitre_domains = [options.domain];
            bundle.objects.push(groupObject.stix);
            objectsMap.set(groupObject.stix.id, true);
            const attackId = linkById.getAttackId(groupObject.stix);
            if (attackId) {
              this.attackObjectByAttackIdCache.set(attackId, groupObject);
            }
          }
        }
      }
    }

    // Handle revoked-by relationships
    for (const relationship of this.allRelationships) {
      if (
        relationship.stix.relationship_type === 'revoked-by' &&
        !relationshipsMap.has(relationship.stix.id) &&
        objectsMap.has(relationship.stix.source_ref) &&
        objectsMap.has(relationship.stix.target_ref)
      ) {
        if (StixBundlesService.relationshipIsActive(relationship)) {
          bundle.objects.push(relationship.stix);
          relationshipsMap.set(relationship.stix.id, true);
        }
      }
    }

    // Add secondary objects that were revoked by other secondary objects
    for (const relationship of this.allRelationships) {
      if (relationship.stix.relationship_type === 'revoked-by') {
        if (
          !objectsMap.has(relationship.stix.source_ref) &&
          objectsMap.has(relationship.stix.target_ref)
        ) {
          const revokedObject = await this.getAttackObject(relationship.stix.source_ref);
          if (StixBundlesService.secondaryObjectIsValid(revokedObject, options)) {
            if (
              revokedObject.stix.type === 'intrusion-set' ||
              revokedObject.stix.type === 'campaign'
            ) {
              revokedObject.stix.x_mitre_domains = [options.domain];
            }
            bundle.objects.push(revokedObject.stix);
            objectsMap.set(revokedObject.stix.id, true);
            const attackId = linkById.getAttackId(revokedObject.stix);
            if (attackId) {
              this.attackObjectByAttackIdCache.set(attackId, revokedObject);
            }
          }
        }
      }
    }

    // Add campaign-to-group attributed-to relationships
    for (const relationship of this.allRelationships) {
      if (
        relationship.stix.relationship_type === 'attributed-to' &&
        !relationshipsMap.has(relationship.stix.id) &&
        objectsMap.has(relationship.stix.source_ref) &&
        objectsMap.has(relationship.stix.target_ref)
      ) {
        if (StixBundlesService.relationshipIsActive(relationship)) {
          bundle.objects.push(relationship.stix);
          relationshipsMap.set(relationship.stix.id, true);
        }
      }
    }
  }

  /**
   * Validates all relationships in the bundle for referential integrity.
   * Ensures that both source and target objects exist for each relationship.
   * Logs warnings for any orphaned references found.
   *
   * @param {Array<Object>} bundleObjects - Array of STIX objects in the bundle
   * @param {Map} objectsMap - Map of object IDs for validation
   */
  static validateRelationships(bundleObjects, objectsMap) {
    for (const stixObject of bundleObjects) {
      if (stixObject.type === 'relationship') {
        if (!objectsMap.has(stixObject.source_ref)) {
          logger.warn(
            `source_ref not found ${stixObject.source_ref} ${stixObject.relationship_type} ${stixObject.target_ref}`,
          );
        }
        if (!objectsMap.has(stixObject.target_ref)) {
          logger.warn(
            `target_ref not found ${stixObject.source_ref} ${stixObject.relationship_type} ${stixObject.target_ref}`,
          );
        }
      }
    }
  }

  // ============================
  // Repository Access Methods (+Cache Management)
  // ============================

  /**
   * Retrieves an attack object by its STIX ID, using cache when possible.
   * Implements a caching strategy to minimize database queries.
   *
   * Process:
   * 1. Check cache using STIX ID
   * 2. If not found, query database
   * 3. If found in database, cache for future use
   * 4. Handle errors gracefully
   *
   * @param {string} stixId - The STIX ID of the object to retrieve
   * @returns {Promise<Object|null>} The attack object or null if not found/error
   */
  async getAttackObject(stixId) {
    try {
      // First check cache
      const cacheKey = stixId;
      if (this.attackObjectCache.has(cacheKey)) {
        return this.attackObjectCache.get(cacheKey);
      }

      // Use the existing repository method that exactly matches the original logic
      const attackObject = await this.repositories.attackObject.retrieveLatestByStixId(stixId);

      if (attackObject) {
        this.attackObjectCache.set(cacheKey, attackObject);
      }

      return attackObject;
    } catch (err) {
      logger.error(`Error retrieving attack object ${stixId}:`, err);
      return null;
    }
  }

  async getAttackObjectFromMap(attackId) {
    return (
      this.attackObjectByAttackIdCache.get(attackId) ||
      (await linkById.getAttackObjectFromDatabase(attackId))
    );
  }
}

module.exports = new StixBundlesService();
