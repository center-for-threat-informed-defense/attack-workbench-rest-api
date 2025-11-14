'use strict';

const uuid = require('uuid');
const logger = require('../lib/logger');
const config = require('../config/config');
const attackIdGenerator = require('../lib/attack-id-generator');
const {
  createAttackExternalReference,
  findAttackExternalReference,
  validateAttackExternalReference,
} = require('../lib/external-reference-builder');
const {
  DatabaseError,
  IdentityServiceError,
  MissingParameterError,
  InvalidQueryStringParameterError,
  InvalidTypeError,
  OrganizationIdentityNotSetError,
  ImmutablePropertyError,
  InvalidPostOperationError,
} = require('../exceptions');
const ServiceWithHooks = require('./_abstract.service');

// Import required repositories
const systemConfigurationRepository = require('../repository/system-configurations-repository');
const identitiesRepository = require('../repository/identities-repository');
const userAccountsService = require('./user-accounts-service');

class BaseService extends ServiceWithHooks {
  constructor(type, repository) {
    super();
    this.type = type;
    this.repository = repository;

    // Initialize caches for identity lookups
    this.identityCache = new Map();
    this.userAccountCache = new Map();
  }

  // ============================
  // Pagination and Utility Methods
  // ============================

  static paginate(options, results) {
    if (options.includePagination) {
      let derivedTotalCount = 0;
      if (results[0].totalCount && results[0].totalCount.length > 0) {
        derivedTotalCount = results[0].totalCount[0].totalCount;
      }
      return {
        pagination: {
          total: derivedTotalCount,
          offset: options.offset,
          limit: options.limit,
        },
        data: results[0].documents,
      };
    } else {
      return results[0].documents;
    }
  }

  // ============================
  // System Configuration Methods
  // ============================

  async retrieveOrganizationIdentityRef() {
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig && systemConfig.organization_identity_ref) {
      return systemConfig.organization_identity_ref;
    } else {
      throw new OrganizationIdentityNotSetError();
    }
  }

  async setDefaultMarkingDefinitionsForObject(attackObject) {
    const systemConfig = await systemConfigurationRepository.retrieveOne({ lean: true });
    if (!systemConfig) return;

    const defaultMarkingDefinitions = systemConfig.default_marking_definitions || [];

    if (attackObject.stix.object_marking_refs) {
      attackObject.stix.object_marking_refs = attackObject.stix.object_marking_refs.concat(
        defaultMarkingDefinitions.filter((e) => !attackObject.stix.object_marking_refs.includes(e)),
      );
    } else {
      attackObject.stix.object_marking_refs = defaultMarkingDefinitions;
    }
  }

  // ============================
  // Identity Management Methods
  // ============================

  async addCreatedByAndModifiedByIdentitiesToAll(attackObjects) {
    for (const attackObject of attackObjects) {
      await this.addCreatedByAndModifiedByIdentities(attackObject);
    }
  }

  async addCreatedByAndModifiedByIdentities(attackObject) {
    if (attackObject?.stix?.created_by_ref) {
      await this.addCreatedByIdentity(attackObject);
    }

    if (attackObject?.stix?.x_mitre_modified_by_ref) {
      await this.addModifiedByIdentity(attackObject);
    }

    if (attackObject?.workspace?.workflow?.created_by_user_account) {
      await this.addCreatedByUserAccountWithCache(attackObject);
    }
  }

  async addCreatedByIdentity(attackObject) {
    if (this.identityCache.has(attackObject.stix.created_by_ref)) {
      attackObject.created_by_identity = this.identityCache.get(attackObject.stix.created_by_ref);
      return;
    }

    if (!attackObject.created_by_identity) {
      try {
        const identityObject = await identitiesRepository.retrieveLatestByStixIdLean(
          attackObject.stix.created_by_ref,
        );
        attackObject.created_by_identity = identityObject;
        this.identityCache.set(attackObject.stix.created_by_ref, identityObject);
      } catch (err) {
        // Ignore lookup errors
        logger.warn(err.message);
      }
    }
  }

  async addModifiedByIdentity(attackObject) {
    if (this.identityCache.has(attackObject.stix.x_mitre_modified_by_ref)) {
      attackObject.modified_by_identity = this.identityCache.get(
        attackObject.stix.x_mitre_modified_by_ref,
      );
      return;
    }

    if (!attackObject.modified_by_identity) {
      try {
        const identityObject = await identitiesRepository.retrieveLatestByStixIdLean(
          attackObject.stix.x_mitre_modified_by_ref,
        );
        attackObject.modified_by_identity = identityObject;
        this.identityCache.set(attackObject.stix.x_mitre_modified_by_ref, identityObject);
      } catch (err) {
        // Ignore lookup errors
        logger.warn(err.message);
      }
    }
  }

  async addCreatedByUserAccountWithCache(attackObject) {
    const userAccountRef = attackObject?.workspace?.workflow?.created_by_user_account;
    if (!userAccountRef) return;

    if (this.userAccountCache.has(userAccountRef)) {
      attackObject.created_by_user_account = this.userAccountCache.get(userAccountRef);
      return;
    }

    if (!attackObject.created_by_user_account) {
      await userAccountsService.addCreatedByUserAccount(attackObject);
      this.userAccountCache.set(userAccountRef, attackObject.created_by_user_account);
    }
  }

  // ============================
  // CRUD Operations
  // ============================

  async retrieveAll(options) {
    let results;
    try {
      results = await this.repository.retrieveAll(options);
    } catch (err) {
      throw new DatabaseError(err);
    }

    try {
      await this.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);
    } catch (err) {
      throw new IdentityServiceError({
        details: err.message,
        cause: err,
      });
    }
    return BaseService.paginate(options, results);
  }

  async retrieveById(stixId, options) {
    if (!stixId) {
      throw new MissingParameterError('stixId');
    }

    if (options.versions === 'all') {
      const documents = await this.repository.retrieveAllById(stixId);

      try {
        await this.addCreatedByAndModifiedByIdentitiesToAll(documents);
      } catch (err) {
        throw new IdentityServiceError({
          details: err.message,
          cause: err,
        });
      }
      return documents;
    } else if (options.versions === 'latest') {
      const document = await this.repository.retrieveLatestByStixId(stixId);

      if (document) {
        try {
          await this.addCreatedByAndModifiedByIdentities(document);
        } catch (err) {
          throw new IdentityServiceError({
            details: err.message,
            cause: err,
          });
        }
        return [document];
      } else {
        return [];
      }
    } else {
      throw new InvalidQueryStringParameterError({ parameterName: 'versions' });
    }
  }

  async retrieveVersionById(stixId, modified) {
    if (!stixId) {
      throw new MissingParameterError('stixId');
    }

    if (!modified) {
      throw new MissingParameterError('modified');
    }

    const document = await this.repository.retrieveOneByVersion(stixId, modified);

    if (!document) {
      return null;
    } else {
      try {
        await this.addCreatedByAndModifiedByIdentities(document);
      } catch (err) {
        throw new IdentityServiceError({
          details: err.message,
          cause: err,
        });
      }
      return document;
    }
  }

  /**
   * Stream multiple attack objects by their version identifiers
   * @param {Array<{object_ref: string, object_modified: string}>} xMitreContents - Array of x_mitre_contents elements
   * @yields {Object} Attack objects with identities populated
   */
  async *streamBulkByIdAndModified(xMitreContents) {
    if (!xMitreContents || !Array.isArray(xMitreContents) || xMitreContents.length === 0) {
      return;
    }

    // Process identities in small batches as we stream
    const identityBatch = [];
    const IDENTITY_BATCH_SIZE = 50;

    for await (const doc of this.repository.streamManyByIdAndModified(xMitreContents)) {
      identityBatch.push(doc);

      // Process identities when batch is full
      if (identityBatch.length >= IDENTITY_BATCH_SIZE) {
        await Promise.all(identityBatch.map((d) => this.addCreatedByAndModifiedByIdentities(d)));

        // Yield processed documents
        for (const processedDoc of identityBatch) {
          yield processedDoc;
        }

        // Clear the batch
        identityBatch.length = 0;
      }
    }

    // Process remaining documents
    if (identityBatch.length > 0) {
      await Promise.all(identityBatch.map((d) => this.addCreatedByAndModifiedByIdentities(d)));

      for (const processedDoc of identityBatch) {
        yield processedDoc;
      }
    }
  }

  /**
   * Retrieve multiple attack objects by their version identifiers
   * @param {Array<{object_ref: string, object_modified: string}>} xMitreContents - Array of x_mitre_contents elements
   * @returns {Promise<Array<Object>>} Array of attack objects with identities populated
   */
  async getBulkByIdAndModified(xMitreContents) {
    if (!xMitreContents || !Array.isArray(xMitreContents) || xMitreContents.length === 0) {
      return [];
    }
    const documents = await this.repository.findManyByIdAndModified(xMitreContents);

    // Process identities in parallel
    await Promise.all(documents.map((doc) => this.addCreatedByAndModifiedByIdentities(doc)));

    return documents;
  }

  // TODO add JSDoc
  // explain what the method handles
  // calls beforeCreate --> {own create logic} --> afterCreate --> emitCreatedEvent
  async create(data, options) {
    if (data?.stix?.type !== this.type) {
      throw new InvalidTypeError();
    }

    options = options || {};

    // LIFECYCLE HOOK: beforeCreate
    // Subclasses can prepare data before core creation logic
    await this.beforeCreate(data, options);
    if (!options.import) {
      const attackIdInExternalReferences = attackIdGenerator.extractAttackIdFromExternalReferences(
        data.stix,
      );
      const attackIdInWorkspace = data.workspace.attack_id;
      const isSubtechnique = data.stix?.x_mitre_is_subtechnique === true;
      const parentTechniqueId = options?.parentTechniqueId;

      // Throw (reject request) if user attempts to manually define the ATT&CK ID -- this field is controlled exclusively by the backend
      if (attackIdInExternalReferences) {
        logger.warn(
          'Immutable property: user attempted to set backend-controlled property, external_references.0.external_id',
        );
        throw new ImmutablePropertyError('external_references.0.external_id');
      } else if (attackIdInWorkspace) {
        logger.warn(
          'Immutable property: user attempted to set backend-controlled property, workspace.attack_id',
        );
        throw new ImmutablePropertyError('workspace.attack_id');
      }

      // Generate ATT&CK ID
      if (attackIdGenerator.requiresAttackId(this.type)) {
        // Validate subtechnique requirements
        if (isSubtechnique && !parentTechniqueId) {
          const errorMessage =
            'Subtechniques require a parentTechniqueId query parameter. Provide the parent technique ATT&CK ID (e.g., T1234).';
          logger.error(errorMessage);
          throw new InvalidPostOperationError(errorMessage);
        }
        if (!isSubtechnique && parentTechniqueId) {
          const errorMessage =
            'parentTechniqueId query parameter is only valid for subtechniques (x_mitre_is_subtechnique: true).';
          logger.error(errorMessage);
          throw new InvalidPostOperationError(errorMessage);
        }

        // Set the ATT&CK ID!
        const attackId = await attackIdGenerator.generateAttackId(
          this.type,
          this.repository,
          isSubtechnique,
          parentTechniqueId,
        );

        data.workspace = data.workspace || {};
        data.workspace.attack_id = attackId;
        logger.debug('Generated and set ATT&CK ID:', attackId);
      }

      // Handle ATT&CK external reference for CREATE operations
      if (data.stix?.external_references) {
        // On create, clients MUST NOT provide ATT&CK external references - the backend controls this
        // Throw (reject request) if user attempts to manually set the MITRE citation in the external_references array
        const mitreAttackRefInExternalReferences =
          attackIdGenerator.extractAttackIdFromExternalReferences(data.stix);
        if (mitreAttackRefInExternalReferences) {
          logger.error(
            'User manually attempted to set the MITRE ATT&CK citation at external_references.0',
          );
          throw new ImmutablePropertyError('external_references.0', {
            input: mitreAttackRefInExternalReferences,
          });
        }
      } else {
        data.stix.external_references = [];
      }

      // Generate and add the ATT&CK external reference
      const attackRef = createAttackExternalReference(data);
      if (attackRef) {
        data.stix.external_references.unshift(attackRef);
      }
      logger.debug(`Generated and set the MITRE ATT&CK external reference: ${attackRef}`);

      // Set the ATT&CK Spec Version
      data.stix.x_mitre_attack_spec_version =
        data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;
      logger.debug(
        `Set the ATT&CK specification version: ${data.stix.x_mitre_attack_spec_version}`,
      );

      // Record the user account that created the object
      if (options.userAccountId) {
        data.workspace.workflow.created_by_user_account = options.userAccountId;
        logger.debug(`Recorded the user account that created the object: ${options.userAccountId}`);
      }

      // Set the default marking definitions
      await this.setDefaultMarkingDefinitionsForObject(data);

      // Get the organization identity
      const organizationIdentityRef = await this.retrieveOrganizationIdentityRef();

      // Check for an existing object
      let existingObject;
      if (data.stix.id) {
        existingObject = await this.repository.retrieveOneById(data.stix.id);
      }

      if (existingObject) {
        // New version of an existing object
        // Only set the x_mitre_modified_by_ref property
        data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
      } else {
        // New object
        // Assign a new STIX id if not already provided
        if (!data.stix.id) {
          data.stix.id = `${data.stix.type}--${uuid.v4()}`;
        }

        // Set the created_by_ref and x_mitre_modified_by_ref properties
        data.stix.created_by_ref = organizationIdentityRef;
        data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
      }
    }

    // Core creation: Save the document
    const createdDocument = await this.repository.save(data);

    // LIFECYCLE HOOK: afterCreate
    // Subclasses can handle post-creation logic
    await this.afterCreate(createdDocument, options);

    // EVENT EMISSION: Emit created event for other services to react
    await this.emitCreatedEvent(createdDocument, options);

    return createdDocument;
  }

  async updateFull(stixId, stixModified, data) {
    if (!stixId) {
      throw new MissingParameterError('stixId');
    }

    if (!stixModified) {
      throw new MissingParameterError('modified');
    }

    const document = await this.repository.retrieveOneByVersion(stixId, stixModified);
    if (!document) {
      return null;
    }

    // LIFECYCLE HOOK: beforeUpdate
    // Subclasses can prepare data before core update logic
    await this.beforeUpdate(stixId, stixModified, data, document);

    // Handle ATT&CK external reference for UPDATE operations
    // On update, clients CAN provide ATT&CK external references, but they must match the existing data
    // and cannot be modified
    if (data.workspace?.attack_id) {
      // Validate that workspace.attack_id hasn't changed
      if (data.workspace.attack_id !== document.workspace.attack_id) {
        throw new ImmutablePropertyError('workspace.attack_id', {
          details: `Expected '${document.workspace.attack_id}' but received '${data.workspace.attack_id}'`,
        });
      }
    }

    if (data.stix?.external_references && attackIdGenerator.requiresAttackId(this.type)) {
      const clientAttackRef = findAttackExternalReference(data.stix.external_references);
      const expectedAttackRef = createAttackExternalReference(document);

      if (clientAttackRef && expectedAttackRef) {
        // Validate that the client-provided ATT&CK reference matches expectations
        const validation = validateAttackExternalReference(clientAttackRef, expectedAttackRef);
        if (!validation.isValid) {
          throw new ImmutablePropertyError('stix.external_references[0] (ATT&CK reference)', {
            details: validation.error,
          });
        }

        // If client didn't provide URL but should have, add it
        if (expectedAttackRef.url && !clientAttackRef.url) {
          clientAttackRef.url = expectedAttackRef.url;
        }
      } else if (!clientAttackRef && expectedAttackRef) {
        // Client didn't provide ATT&CK reference - add it
        data.stix.external_references.unshift(expectedAttackRef);
      }
    }

    const newDocument = await this.repository.updateAndSave(document, data);

    if (newDocument === document) {
      // LIFECYCLE HOOK: afterUpdate
      // Subclasses can handle post-update logic
      await this.afterUpdate(newDocument, document);

      // EVENT EMISSION: Emit updated event for other services to react
      await this.emitUpdatedEvent(newDocument, document);

      // Document successfully saved
      return newDocument;
    } else {
      throw new DatabaseError({
        details: 'Document could not be saved',
        document, // Pass along the document that could not be saved
      });
    }
  }

  // TODO rename to deleteVersionByStixId and repurpose the existing name for deleting by the document's unique _id
  async deleteVersionById(stixId, stixModified) {
    if (!stixId) {
      throw new MissingParameterError('stixId');
    }

    if (!stixModified) {
      throw new MissingParameterError('modified');
    }

    const document = await this.repository.findOneAndDelete(stixId, stixModified);

    if (!document) {
      //Note: document is null if not found
      return null;
    }
    return document;
  }

  // TODO rename to deleteManyByStixId
  async deleteById(stixId) {
    if (!stixId) {
      throw new MissingParameterError('stixId');
    }
    return await this.repository.deleteMany(stixId);
  }
}

module.exports = BaseService;
