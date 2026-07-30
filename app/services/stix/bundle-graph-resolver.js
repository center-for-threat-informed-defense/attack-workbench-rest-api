'use strict';

const _ = require('lodash');
const linkById = require('../../lib/linkById');
const logger = require('../../lib/logger');

/**
 * Resolves the bounded ATT&CK object graph used by bundle exports.
 *
 * A resolver instance belongs to exactly one export request. Keeping its
 * caches, relationship set, and inferred-domain state request-local prevents
 * overlapping exports from observing or overwriting each other's state.
 *
 * This resolver deliberately preserves the legacy one-hop relationship
 * expansion and named ATT&CK special cases. It is not a general transitive
 * graph walker.
 */
class BundleGraphResolver {
  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.attackObjectsRepository
   * @param {Object} dependencies.detectionStrategiesRepository
   * @param {Object} dependencies.policy
   * @param {Function} dependencies.policy.isDeprecatedPattern
   * @param {Function} dependencies.policy.relationshipIsActive
   * @param {Function} dependencies.policy.secondaryObjectIsValid
   * @param {Object} dependencies.options
   * @param {Array<Object>} dependencies.relationships
   */
  constructor({
    attackObjectsRepository,
    detectionStrategiesRepository,
    repositoryMap,
    policy,
    options,
    relationships,
    onMissingDependency,
  }) {
    this.attackObjectsRepository = attackObjectsRepository;
    this.detectionStrategiesRepository = detectionStrategiesRepository;
    this.repositoryMap = repositoryMap;
    this.exactEndpoints = Boolean(repositoryMap);
    this.policy = policy;
    this.options = options;
    this.relationships = _.cloneDeep(relationships);
    this.onMissingDependency = onMissingDependency;

    this.attackObjectCache = new Map();
    this.attackObjectByAttackIdCache = new Map();
    this.domainCache = new Map();
    this.dependencies = new Map();
  }

  revisionKey(objectRef, objectModified) {
    return `${objectRef}::${new Date(objectModified).getTime()}`;
  }

  documentKey(document) {
    return this.exactEndpoints
      ? this.revisionKey(document.stix.id, document.stix.modified)
      : document.stix.id;
  }

  endpointKey(relationship, side) {
    const objectRef = relationship.stix[`${side}_ref`];
    if (!this.exactEndpoints) return objectRef;
    const endpoint = relationship.workspace?.relationship_endpoints?.[side];
    if (endpoint?.object_ref !== objectRef || !endpoint.object_modified) {
      return `${objectRef}::unpinned`;
    }
    return this.revisionKey(endpoint.object_ref, endpoint.object_modified);
  }

  hasEndpoint(objectsMap, relationship, side) {
    return objectsMap.has(this.endpointKey(relationship, side));
  }

  endpointDocument(objectsMap, relationship, side) {
    return objectsMap.get(this.endpointKey(relationship, side));
  }

  rememberDependency(document, sourceDocument) {
    if (!document || !sourceDocument) return;
    const key = this.documentKey(document);
    const sources = this.dependencies.get(key) || new Map();
    sources.set(this.documentKey(sourceDocument), {
      object_ref: sourceDocument.stix.id,
      object_modified: sourceDocument.stix.modified,
    });
    this.dependencies.set(key, sources);
  }

  /**
   * Resolve the object and relationship graph for the supplied primary roots.
   *
   * @param {Array<Object>} primaryObjects Workbench-shaped primary documents
   * @returns {Promise<{
   *   objects: Array<Object>,
   *   documents: Array<Object>,
   *   relationships: Array<Object>,
   *   attackObjectByAttackIdCache: Map
   * }>}
   */
  async resolve(primaryObjects) {
    const objects = [];
    const objectsMap = new Map();

    for (const primaryObject of _.cloneDeep(primaryObjects)) {
      this.addAttackObject(primaryObject, objects, objectsMap);
    }

    const primaryObjectRelationships = this.relationships.filter(
      (relationship) =>
        this.hasEndpoint(objectsMap, relationship, 'source') ||
        this.hasEndpoint(objectsMap, relationship, 'target'),
    );

    await this.addSecondaryObjects(primaryObjectRelationships, objectsMap, objects);
    await this.processSecondaryRelationships(objects, objectsMap);

    const selectedRelationships = [];
    for (const relationship of this.relationships) {
      if (this.relationshipCanBeEmitted(relationship, objectsMap)) {
        objects.push(relationship.stix);
        selectedRelationships.push(relationship);
      }
    }

    return {
      objects,
      documents: [...objectsMap.values()],
      relationships: selectedRelationships,
      attackObjectByAttackIdCache: this.attackObjectByAttackIdCache,
      dependencies: new Map(
        [...this.dependencies].map(([key, sources]) => [key, [...sources.values()]]),
      ),
    };
  }

  /**
   * Load identities and marking definitions referenced by the resolved graph.
   *
   * @param {Array<Object>} stixObjects
   * @returns {Promise<Array<Object>>} STIX-shaped supporting objects
   */
  async loadSupportingObjects(stixObjects) {
    return (await this.loadSupportingDocuments(stixObjects)).map((document) => document.stix);
  }

  /**
   * Load Workbench-shaped supporting documents for manifest capture.
   *
   * @param {Array<Object>} stixObjects
   * @returns {Promise<Array<Object>>}
   */
  async loadSupportingDocuments(stixObjects) {
    const identityRefs = new Set();
    const markingRefs = new Set();

    for (const stixObject of stixObjects) {
      if (stixObject.created_by_ref) {
        identityRefs.add(stixObject.created_by_ref);
      }
      for (const markingRef of stixObject.object_marking_refs || []) {
        markingRefs.add(markingRef);
      }
    }

    const supportingDocuments = [];
    for (const stixId of identityRefs) {
      const identity = await this.getAttackObject(stixId);
      if (identity) {
        supportingDocuments.push(identity);
      } else {
        logger.warn(`Referenced identity not found: ${stixId}`);
      }
    }

    for (const stixId of markingRefs) {
      const markingDefinition = await this.getAttackObject(stixId);
      if (markingDefinition) {
        supportingDocuments.push(markingDefinition);
      }
    }

    return supportingDocuments;
  }

  /**
   * Resolve one attack object by STIX ID within this request.
   *
   * The legacy exporter is intentionally best-effort. Deterministic snapshot
   * capture will use a strict adapter that treats missing dependencies as an
   * integrity failure.
   *
   * @param {string} stixId
   * @returns {Promise<Object|null>}
   */
  async getAttackObject(stixId) {
    try {
      if (this.attackObjectCache.has(stixId)) {
        return this.attackObjectCache.get(stixId);
      }

      const attackObject = await this.attackObjectsRepository.retrieveLatestByStixIdLean(stixId);
      const requestLocalObject = attackObject ? _.cloneDeep(attackObject) : null;

      if (requestLocalObject) {
        this.attackObjectCache.set(stixId, requestLocalObject);
      }
      return requestLocalObject;
    } catch (err) {
      logger.error(`Error retrieving attack object ${stixId}:`, err);
      return null;
    }
  }

  async getAttackObjectRevision(objectRef, objectModified) {
    if (!objectModified || !this.repositoryMap) {
      return this.getAttackObject(objectRef);
    }

    const cacheKey = `${objectRef}::${new Date(objectModified).getTime()}`;
    if (this.attackObjectCache.has(cacheKey)) {
      return this.attackObjectCache.get(cacheKey);
    }

    const repository = this.repositoryMap[objectRef.split('--')[0]];
    if (!repository) {
      return null;
    }

    const attackObject = (
      await repository.findManyByIdAndModified([
        {
          object_ref: objectRef,
          object_modified: objectModified,
        },
      ])
    )[0];
    const requestLocalObject = attackObject ? _.cloneDeep(attackObject) : null;
    this.attackObjectCache.set(cacheKey, requestLocalObject);
    return requestLocalObject;
  }

  async getRelationshipEndpoint(relationship, side) {
    const endpoint = relationship.workspace?.relationship_endpoints?.[side];
    const objectRef = relationship.stix[`${side}_ref`];
    const object = await this.getAttackObjectRevision(
      objectRef,
      endpoint?.object_ref === objectRef ? endpoint.object_modified : undefined,
    );
    if (!object && endpoint?.object_ref === objectRef && endpoint.object_modified) {
      this.onMissingDependency?.({
        object_ref: objectRef,
        object_modified: endpoint.object_modified,
        dependency: 'relationship_endpoint',
      });
    }
    return object;
  }

  addAttackObject(attackObject, objects, objectsMap) {
    if (!attackObject || objectsMap.has(this.documentKey(attackObject))) {
      return;
    }

    objects.push(attackObject.stix);
    objectsMap.set(this.documentKey(attackObject), attackObject);
    const attackId = linkById.getAttackId(attackObject.stix);
    if (attackId) {
      this.attackObjectByAttackIdCache.set(attackId, attackObject);
    }
  }

  relationshipCanBeEmitted(relationship, objectsMap) {
    return (
      !this.policy.isDeprecatedPattern(relationship.stix) &&
      this.policy.relationshipIsActive(relationship) &&
      this.hasEndpoint(objectsMap, relationship, 'source') &&
      this.hasEndpoint(objectsMap, relationship, 'target')
    );
  }

  async processSecondaryObject(secondaryObject) {
    if (!this.policy.secondaryObjectIsValid(secondaryObject, this.options)) {
      return false;
    }

    if (
      this.options.inferDomains !== false &&
      (secondaryObject.stix.type === 'intrusion-set' || secondaryObject.stix.type === 'campaign')
    ) {
      if (secondaryObject.stix.x_mitre_domains) {
        this.domainCache.set(secondaryObject.stix.id, secondaryObject.stix.x_mitre_domains);
      }
      secondaryObject.stix.x_mitre_domains =
        await this.getDomainsForSecondaryObject(secondaryObject);
    }
    return true;
  }

  async getDomainsForSecondaryObject(attackObject) {
    const relationships = this.relationships.filter(
      (relationship) => relationship.stix.source_ref === attackObject.stix.id,
    );

    const domains = new Set();
    for (const relationship of relationships) {
      const targetObject = await this.getRelationshipEndpoint(relationship, 'target');
      const targetDomains =
        this.domainCache.get(targetObject?.stix.id) || targetObject?.stix.x_mitre_domains || [];
      for (const domain of targetDomains) {
        domains.add(domain);
      }
    }
    return [...domains];
  }

  async addSecondaryObjects(primaryObjectRelationships, objectsMap, objects) {
    for (const relationship of primaryObjectRelationships) {
      if (relationship.stix.relationship_type === 'detects') {
        continue;
      }

      let secondarySide;
      if (!this.hasEndpoint(objectsMap, relationship, 'source')) {
        secondarySide = 'source';
      } else if (!this.hasEndpoint(objectsMap, relationship, 'target')) {
        secondarySide = 'target';
      }

      if (!secondarySide) {
        continue;
      }

      const secondaryObject = await this.getRelationshipEndpoint(relationship, secondarySide);
      if (await this.processSecondaryObject(secondaryObject)) {
        const primarySide = secondarySide === 'source' ? 'target' : 'source';
        this.rememberDependency(
          secondaryObject,
          this.endpointDocument(objectsMap, relationship, primarySide),
        );
        this.addAttackObject(secondaryObject, objects, objectsMap);
      }
    }
  }

  async processSecondaryRelationships(objects, objectsMap) {
    for (const relationship of this.relationships) {
      await this.addAttributedGroup(relationship, objects, objectsMap);
      await this.addDetectionStrategy(relationship, objects, objectsMap);
      await this.addRevokedSecondaryObject(relationship, objects, objectsMap);
    }

    const analyticIds = objects
      .filter((object) => object.type === 'x-mitre-analytic')
      .map((analytic) => analytic.id);

    if (analyticIds.length === 0) {
      return;
    }

    const detectionStrategyDocs = await this.detectionStrategiesRepository.findByAnalyticRefs(
      analyticIds,
      this.options,
    );

    for (const sourceDoc of detectionStrategyDocs) {
      const detectionStrategyDoc = _.cloneDeep(sourceDoc);
      if (
        !objectsMap.has(this.documentKey(detectionStrategyDoc)) &&
        this.policy.secondaryObjectIsValid(detectionStrategyDoc, this.options)
      ) {
        for (const analyticId of detectionStrategyDoc.stix.x_mitre_analytic_refs || []) {
          for (const candidate of objectsMap.values()) {
            if (candidate.stix.id === analyticId) {
              this.rememberDependency(detectionStrategyDoc, candidate);
            }
          }
        }
        this.rememberAndSetDomains(detectionStrategyDoc, [this.options.domain]);
        this.addAttackObject(detectionStrategyDoc, objects, objectsMap);
      }
    }
  }

  async addAttributedGroup(relationship, objects, objectsMap) {
    if (
      relationship.stix.relationship_type !== 'attributed-to' ||
      !this.hasEndpoint(objectsMap, relationship, 'source') ||
      this.hasEndpoint(objectsMap, relationship, 'target')
    ) {
      return;
    }

    const groupObject = await this.getRelationshipEndpoint(relationship, 'target');
    if (
      groupObject?.stix.type === 'intrusion-set' &&
      this.policy.secondaryObjectIsValid(groupObject, this.options)
    ) {
      this.rememberDependency(
        groupObject,
        this.endpointDocument(objectsMap, relationship, 'source'),
      );
      this.rememberAndSetDomains(groupObject, [this.options.domain]);
      this.addAttackObject(groupObject, objects, objectsMap);
    }
  }

  async addDetectionStrategy(relationship, objects, objectsMap) {
    if (
      relationship.stix.relationship_type !== 'detects' ||
      !this.hasEndpoint(objectsMap, relationship, 'target') ||
      this.hasEndpoint(objectsMap, relationship, 'source')
    ) {
      return;
    }

    const detectionStrategy = await this.getRelationshipEndpoint(relationship, 'source');
    if (
      detectionStrategy?.stix.type === 'x-mitre-detection-strategy' &&
      this.policy.secondaryObjectIsValid(detectionStrategy, this.options)
    ) {
      this.rememberDependency(
        detectionStrategy,
        this.endpointDocument(objectsMap, relationship, 'target'),
      );
      this.rememberAndSetDomains(detectionStrategy, [this.options.domain]);
      this.addAttackObject(detectionStrategy, objects, objectsMap);
    }
  }

  async addRevokedSecondaryObject(relationship, objects, objectsMap) {
    if (
      relationship.stix.relationship_type !== 'revoked-by' ||
      this.hasEndpoint(objectsMap, relationship, 'source') ||
      !this.hasEndpoint(objectsMap, relationship, 'target')
    ) {
      return;
    }

    const revokedObject = await this.getRelationshipEndpoint(relationship, 'source');
    if (!this.policy.secondaryObjectIsValid(revokedObject, this.options)) {
      return;
    }

    this.rememberDependency(
      revokedObject,
      this.endpointDocument(objectsMap, relationship, 'target'),
    );
    if (revokedObject.stix.type === 'intrusion-set' || revokedObject.stix.type === 'campaign') {
      this.rememberAndSetDomains(revokedObject, [this.options.domain]);
    }
    this.addAttackObject(revokedObject, objects, objectsMap);
  }

  rememberAndSetDomains(attackObject, domains) {
    if (this.options.inferDomains === false) {
      return;
    }
    if (attackObject.stix.x_mitre_domains) {
      this.domainCache.set(attackObject.stix.id, attackObject.stix.x_mitre_domains);
    }
    attackObject.stix.x_mitre_domains = domains;
  }
}

module.exports = BundleGraphResolver;
