'use strict';

const uuid = require('uuid');
const logger = require('../lib/logger');
const config = require('../config/config');
const {
  DatabaseError,
  IdentityServiceError,
  MissingParameterError,
  InvalidQueryStringParameterError,
  InvalidTypeError,
  OrganizationIdentityNotSetError,
} = require('../exceptions');
const AbstractService = require('./_abstract.service');

// Import required repositories
const systemConfigurationRepository = require('../repository/system-configurations-repository');
const identitiesRepository = require('../repository/identities-repository');
const userAccountsService = require('./user-accounts-service');

class BaseService extends AbstractService {
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
        const identityObject = await identitiesRepository.retrieveLatestByStixId(
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
        const identityObject = await identitiesRepository.retrieveLatestByStixId(
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
      throw new MissingParameterError({ parameterName: 'stixId' });
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
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!modified) {
      throw new MissingParameterError({ parameterName: 'modified' });
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

  async create(data, options) {
    if (data?.stix?.type !== this.type) {
      throw new InvalidTypeError();
    }

    options = options || {};
    if (!options.import) {
      // Set the ATT&CK Spec Version
      data.stix.x_mitre_attack_spec_version =
        data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

      // Record the user account that created the object
      if (options.userAccountId) {
        data.workspace.workflow.created_by_user_account = options.userAccountId;
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
    return await this.repository.save(data);
  }

  async updateFull(stixId, stixModified, data) {
    if (!stixId) {
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!stixModified) {
      throw new MissingParameterError({ parameterName: 'modified' });
    }

    const document = await this.repository.retrieveOneByVersion(stixId, stixModified);
    if (!document) {
      return null;
    }

    const newDocument = await this.repository.updateAndSave(document, data);

    if (newDocument === document) {
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
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!stixModified) {
      throw new MissingParameterError({ parameterName: 'modified' });
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
      throw new MissingParameterError({ parameterName: 'stixId' });
    }
    return await this.repository.deleteMany(stixId);
  }
}

module.exports = BaseService;
