'use strict';

const uuid = require('uuid');
const config = require('../../config/config');
const { BaseService } = require('../meta-classes');
const linkById = require('../../lib/linkById');
const bundleRelationships = require('../../lib/stix-bundle-relationships');
const { requiresAttackId } = require('../../lib/attack-id-generator');
const stixConformance = require('../../lib/stix-conformance');
const BundleGraphResolver = require('./bundle-graph-resolver');

// Import repositories
const analyticsRepository = require('../../repository/analytics-repository');
const attackObjectsRepository = require('../../repository/attack-objects-repository');
const matrixRepository = require('../../repository/matrix-repository');
const mitigationsRepository = require('../../repository/mitigations-repository');
const notesRepository = require('../../repository/notes-repository');
const relationshipsRepository = require('../../repository/relationships-repository');
const softwareRepository = require('../../repository/software-repository');
const tacticsRepository = require('../../repository/tactics-repository');
const techniquesRepository = require('../../repository/techniques-repository');
const dataComponentsRepository = require('../../repository/data-components-repository');
const dataSourcesRepository = require('../../repository/data-sources-repository');
const detectionStrategiesRepository = require('../../repository/detection-strategies-repository');

// Import services
const notesService = require('../system/notes-service');

/**
 * Service for generating STIX bundles from the ATT&CK database.
 *
 * CORE CONCEPTS (New ATT&CK Specification):
 *
 * This service makes an important distinction between "primary" and "secondary" objects
 * when generating STIX bundles:
 *
 * PRIMARY OBJECTS:
 * - Objects that directly belong to the requested domain (e.g., enterprise-attack, mobile-attack)
 * - Users can explicitly set/modify the x_mitre_domains field for these objects
 * - These are retrieved in the initial database query by domain
 * - Examples for enterprise-attack domain:
 *   * Techniques (attack-pattern) like "Process Injection"
 *   * Tactics (x-mitre-tactic) like "Persistence"
 *   * Mitigations (course-of-action) specific to enterprise
 *   * Software/Tools (malware/tool) used in enterprise attacks
 *   * Data Components (x-mitre-data-component) - NEW in current spec
 *   * Data Sources (x-mitre-data-source) - deprecated but still primary
 *   * Analytics (x-mitre-analytic) - NEW in current spec
 *
 * SECONDARY OBJECTS:
 * - Objects that are related to primary objects through relationships or references
 * - Cannot be directly assigned to domains by users
 * - Their domain membership is inferred from relationships to primary objects
 * - Need to be validated before inclusion in the bundle
 * - Examples:
 *   * Threat Groups (intrusion-set) that use techniques in the domain
 *   * Campaigns that deploy malware in the domain
 *   * Detection Strategies (x-mitre-detection-strategy) - NEW in current spec
 *     - Included if they detect a technique in the bundle, OR
 *     - Included if they reference an analytic (via x_mitre_analytic_refs) in the bundle
 *
 * EXAMPLE SCENARIO:
 * When requesting enterprise-attack domain bundle:
 * 1. Primary Objects (from initial query):
 *    - Technique T1055 "Process Injection"
 *    - Analytic ANA-001 "Process Injection Detection"
 *    - Data Component DC-001 "Process Creation"
 *
 * 2. Relationships and references discovered:
 *    - Group G0096 uses Technique T1055 (relationship)
 *    - Detection Strategy DS-001 detects Technique T1055 (relationship)
 *    - Detection Strategy DS-002 references Analytic ANA-001 (via x_mitre_analytic_refs)
 *
 * 3. Secondary Objects (need validation and domain inference):
 *    - Group G0096
 *    - Detection Strategy DS-001
 *    - Detection Strategy DS-002
 *
 * The complex relationship processing in this service handles:
 * 1. Primary → Primary relationships (simplest case)
 * 2. Primary → Secondary relationships (need to fetch/validate secondary)
 * 3. Secondary → Primary relationships (need to fetch/validate secondary)
 * 4. Special cases:
 *    - 'detects' relationships (for detection strategies)
 *    - 'attributed-to' relationships (for groups/campaigns)
 *    - x_mitre_analytic_refs (for detection strategies referencing analytics)
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
      analytic: analyticsRepository,
      attackObject: attackObjectsRepository,
      matrix: matrixRepository,
      mitigation: mitigationsRepository,
      note: notesRepository,
      relationship: relationshipsRepository,
      software: softwareRepository,
      tactic: tacticsRepository,
      technique: techniquesRepository,
      dataComponent: dataComponentsRepository,
      dataSource: dataSourcesRepository,
      detectionStrategy: detectionStrategiesRepository,
    };
  }

  // ============================
  // Deprecated Pattern Filtering
  // ============================

  /**
   * Defines deprecated patterns that should be excluded from new spec bundles.
   * This centralized list makes it easy to manage which deprecated patterns
   * are filtered out of exports when using the new ATT&CK specification.
   *
   * Each entry defines criteria for filtering:
   * - type: The STIX object type (e.g., 'relationship')
   * - conditions: Object with properties that must match for exclusion
   *
   * DEPRECATED PATTERNS (ATT&CK v17+):
   * - SRO<x-mitre-data-component, detects, attack-pattern>
   *   Reason: Data components no longer detect techniques; detection strategies do
   */
  static DEPRECATED_PATTERNS = bundleRelationships.DEPRECATED_PATTERNS;

  /**
   * Checks if a STIX object matches any deprecated pattern and should be excluded.
   * @param {Object} stixObject - The STIX object to check
   * @returns {boolean} True if the object matches a deprecated pattern
   */
  static isDeprecatedPattern(stixObject) {
    return bundleRelationships.isDeprecatedPattern(stixObject);
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

  // ============================
  // STIX Version Management
  // ============================

  /**
   * Removes empty array properties from a STIX object.
   * Delegates to the shared lib/stix-conformance helpers.
   * @param {Object} stixObject - The STIX object to clean
   */
  static removeEmptyArrays(stixObject) {
    stixConformance.removeEmptyArrays(stixObject);
  }

  /**
   * Modifies a STIX object to conform to the specified STIX version (2.0 or 2.1).
   * Delegates to the shared lib/stix-conformance helpers.
   * @param {Object} stixObject - The STIX object to modify
   */
  static conformToStixVersion(stixObject, stixVersion) {
    stixConformance.conformToStixVersion(stixObject, stixVersion);
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
    return bundleRelationships.relationshipIsActive(relationship);
  }

  /**
   * Adds a relationship to the STIX bundle, if:
   * - It is active, as per relationshipIsActive()
   * - Its source_ref and target_ref exist in objectsMap
   * - It does not match any deprecated patterns
   *
   * @param {Object} relationship - The relationship object to add
   * @param {Object} bundle - The STIX bundle being built
   * @param {Map} objectsMap - Map tracking objects in the bundle
   */
  static addRelationshipToBundle(relationship, bundle, objectsMap) {
    // Filter out deprecated patterns (e.g., data component detects relationships)
    if (StixBundlesService.isDeprecatedPattern(relationship.stix)) {
      return;
    }

    if (
      StixBundlesService.relationshipIsActive(relationship) &&
      objectsMap.has(relationship.stix.source_ref) &&
      objectsMap.has(relationship.stix.target_ref)
    ) {
      bundle.objects.push(relationship.stix);
    }
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
        !requiresAttackId(secondaryObject?.stix?.type) ||
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

  // ============================
  // Collection Object Management
  // ============================

  /**
   * Add an x-mitre-collection object to the bundle, based on the objects inside.
   * @param {Object} bundle - The bundle to update
   * @param {Object} options - Bundle generation options
   */
  static addCollectionObject(bundle, options) {
    const domain_info = {
      'enterprise-attack': {
        name: 'Enterprise ATT&CK',
        creation_date: '2018-01-17T12:56:55.080Z',
        description:
          'ATT&CK for Enterprise provides a knowledge base of real-world adversary behavior targeting traditional enterprise networks. ATT&CK for Enterprise covers the following platforms: Windows, macOS, Linux, PRE, Office 365, Google Workspace, IaaS, Network, and Containers.',
        collection_id: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
      },
      'mobile-attack': {
        name: 'Mobile ATT&CK',
        creation_date: '2018-01-17T12:56:55.080Z',
        description:
          "ATT&CK for Mobile is a matrix of adversary behavior against mobile devices (smartphones and tablets running the Android or iOS/iPadOS operating systems). ATT&CK for Mobile builds upon NIST's Mobile Threat Catalogue and also contains a separate matrix of network-based effects, which are techniques that an adversary can employ without access to the mobile device itself.",
        collection_id: 'x-mitre-collection--dac0d2d7-8653-445c-9bff-82f934c1e858',
      },
      'ics-attack': {
        name: 'ICS ATT&CK',
        creation_date: '2020-10-27T14:49:39.188Z',
        description:
          'The ATT&CK for Industrial Control Systems (ICS) knowledge base categorizes the unique set of tactics, techniques, and procedures (TTPs) used by threat actors in the ICS technology domain. ATT&CK for ICS outlines the portions of an ICS attack that are out of scope of Enterprise and reflects the various phases of an adversary’s attack life cycle and the assets and systems they are known to target.',
        collection_id: 'x-mitre-collection--90c00720-636b-4485-b342-8751d232bf09',
      },
    };

    const collectionObject = {
      type: 'x-mitre-collection',
      id: domain_info[options.domain].collection_id,
      spec_version: options.spec_version,
      x_mitre_attack_spec_version: options.collectionAttackSpecVersion,
      name: domain_info[options.domain].name,
      x_mitre_version: options.collectionObjectVersion,
      description: domain_info[options.domain].description,
      created_by_ref: '',
      created: domain_info[options.domain].creation_date,
      modified: options.collectionObjectModified,
      x_mitre_contents: [],
      object_marking_refs: [],
    };

    for (const bundleObject of bundle.objects) {
      if (bundleObject.type === 'marking-definition') {
        collectionObject.object_marking_refs.push(bundleObject.id);
      } else {
        collectionObject.x_mitre_contents.push({
          object_ref: bundleObject.id,
          object_modified: bundleObject.modified,
        });
        // TODO: Make this not specific to MITRE
        if (bundleObject.type === 'identity' && bundleObject.name === 'The MITRE Corporation') {
          collectionObject.created_by_ref = bundleObject.id;
        }
      }
    }

    if (options.stixVersion == '2.1') {
      collectionObject.spec_version = '2.1';
    }

    // Sort x_mitre_contents by id
    collectionObject.x_mitre_contents.sort((x, y) => x.object_ref.localeCompare(y.object_ref));

    bundle.objects.unshift(collectionObject);
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
   * - Adding an x-mitre-collection object, if requested
   *
   * @param {Object} options - Bundle generation options
   * @param {string} options.domain - The domain to generate bundle for (e.g., 'enterprise-attack')
   * @param {string} options.stixVersion - Target STIX version ('2.0' or '2.1')
   * @param {boolean} options.includeRevoked - Whether to include revoked objects
   * @param {boolean} options.includeDeprecated - Whether to include deprecated objects
   * @param {boolean} options.includeMissingAttackId - Whether to include objects without ATT&CK IDs
   * @param {boolean} options.includeNotes - Whether to include associated notes
   * @param {boolean} options.includeCollectionObject - Whether to create an x-mitre-collection object
   * @param {boolean} options.collectionObjectVersion - x_mitre_version of the collection object
   * @param {boolean} options.collectionAttackSpecVersion - x_mitre_attack_spec_version of the collection object
   * @param {boolean} options.collectionObjectModified - Modified timestamp of the collection object
   * @param {boolean} [options.includeDataSources=false] - Whether to include deprecated data sources
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

    // Retrieve primary objects
    const [
      domainMitigations,
      domainSoftware,
      domainTactics,
      domainTechniques,
      domainMatrices,
      domainAnalytics,
      domainDataComponents,
      domainDataSources,
    ] = await Promise.all([
      this.repositories.mitigation.retrieveAllByDomain(options.domain, options),
      this.repositories.software.retrieveAllByDomain(options.domain, options),
      this.repositories.tactic.retrieveAllByDomain(options.domain, options),
      this.repositories.technique.retrieveAllByDomain(options.domain, options),
      this.repositories.matrix.retrieveAllByDomain(options.domain, options),
      this.repositories.analytic.retrieveAllByDomain(options.domain, options),
      this.repositories.dataComponent.retrieveAllByDomain(options.domain, options),
      this.repositories.dataSource.retrieveAllByDomain(options.domain, options),
    ]);

    // Filter out analytics that don't have a URL, since they're not yet linked to a detection strategy
    const filteredDomainAnalytics = domainAnalytics.filter((a) => {
      const externalReferences = a?.stix?.external_references;
      return (
        Array.isArray(externalReferences) &&
        externalReferences.length > 0 &&
        externalReferences[0].url
      );
    });

    let primaryObjects = [
      ...domainMatrices,
      ...domainMitigations,
      ...domainSoftware,
      ...domainTactics,
      ...domainTechniques,
      ...filteredDomainAnalytics,
      ...domainDataComponents,
      ...(options.includeDataSources === true ? domainDataSources : []),
    ];

    if (primaryObjects.length === 0) {
      return bundle;
    }

    if (!options.includeMissingAttackId) {
      primaryObjects = primaryObjects.filter((o) => StixBundlesService.hasAttackId(o));
    }

    const relationships = await this.repositories.relationship.retrieveAllForBundle(options);
    const graphResolver = new BundleGraphResolver({
      attackObjectsRepository: this.repositories.attackObject,
      detectionStrategiesRepository: this.repositories.detectionStrategy,
      policy: {
        isDeprecatedPattern: StixBundlesService.isDeprecatedPattern,
        relationshipIsActive: StixBundlesService.relationshipIsActive,
        secondaryObjectIsValid: StixBundlesService.secondaryObjectIsValid,
      },
      options,
      relationships,
    });
    const resolvedGraph = await graphResolver.resolve(primaryObjects);
    bundle.objects.push(...resolvedGraph.objects);

    // Add notes if requested
    if (options.includeNotes) {
      await notesService.addNotes(bundle.objects);
    }

    // Convert LinkById tags to markdown citations
    await this.convertLinkByIdTags(bundle.objects, resolvedGraph.attackObjectByAttackIdCache);

    // Process identities and marking definitions
    bundle.objects.push(...(await graphResolver.loadSupportingObjects(bundle.objects)));

    // Conform to STIX version
    for (const stixObject of bundle.objects) {
      StixBundlesService.conformToStixVersion(stixObject, options.stixVersion);
    }

    if (options.includeCollectionObject && options.stixVersion === '2.1') {
      StixBundlesService.addCollectionObject(bundle, options);
    }
    return bundle;
  }

  /**
   * Converts LinkById tags to markdown citations
   * @param {Array<Object>} bundleObjects - Objects in the bundle
   * @param {Map} attackObjectByAttackIdCache - Map of attack objects
   */
  async convertLinkByIdTags(bundleObjects, attackObjectByAttackIdCache) {
    const getAttackObjectFromMap = async function (attackId) {
      return (
        attackObjectByAttackIdCache.get(attackId) ||
        (await linkById.getAttackObjectFromDatabase(attackId))
      );
    };

    for (const bundleObject of bundleObjects) {
      await linkById.convertLinkByIdTags(bundleObject, getAttackObjectFromMap);
    }
  }
}

module.exports = new StixBundlesService();
