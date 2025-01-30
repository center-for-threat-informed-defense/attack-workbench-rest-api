'use strict';

const uuid = require('uuid');
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

  static isCallback(arg) {
    return typeof arg === 'function';
  }

  // ============================
  // System Configuration Methods
  // ============================

  // TODO resolve this linting issue at some point - it was less impactful to just bypass it at the time
  // eslint-disable-next-line class-methods-use-this
  async retrieveOrganizationIdentityRef() {
    const systemConfig = await systemConfigurationRepository.retrieveOne();

    if (systemConfig && systemConfig.organization_identity_ref) {
      return systemConfig.organization_identity_ref;
    } else {
      throw new OrganizationIdentityNotSetError();
    }
  }

  // TODO resolve this linting issue at some point - it was less impactful to just bypass it at the time
  // eslint-disable-next-line class-methods-use-this
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
      } catch {
        // Ignore lookup errors
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
      } catch {
        // Ignore lookup errors
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

  async retrieveAll(options, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }

    let results;
    try {
      results = await this.repository.retrieveAll(options);
    } catch (err) {
      const databaseError = new DatabaseError(err);
      if (callback) {
        return callback(databaseError);
      }
      throw databaseError;
    }

    try {
      await this.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);
    } catch (err) {
      const identityError = new IdentityServiceError({
        details: err.message,
        cause: err,
      });
      if (callback) {
        return callback(identityError);
      }
      throw identityError;
    }

    const paginatedResults = BaseService.paginate(options, results);
    if (callback) {
      return callback(null, paginatedResults);
    }
    return paginatedResults;
  }

  async retrieveById(stixId, options, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }

    if (!stixId) {
      const err = new MissingParameterError({ parameterName: 'stixId' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    try {
      if (options.versions === 'all') {
        const documents = await this.repository.retrieveAllById(stixId);

        try {
          await this.addCreatedByAndModifiedByIdentitiesToAll(documents);
        } catch (err) {
          const identityError = new IdentityServiceError({
            details: err.message,
            cause: err,
          });
          if (callback) {
            return callback(identityError);
          }
          throw identityError;
        }
        if (callback) {
          return callback(null, documents);
        }
        return documents;
      } else if (options.versions === 'latest') {
        const document = await this.repository.retrieveLatestByStixId(stixId);

        if (document) {
          try {
            await this.addCreatedByAndModifiedByIdentities(document);
          } catch (err) {
            const identityError = new IdentityServiceError({
              details: err.message,
              cause: err,
            });
            if (callback) {
              return callback(identityError);
            }
            throw identityError;
          }
          if (callback) {
            return callback(null, [document]);
          }
          return [document];
        } else {
          if (callback) {
            return callback(null, []);
          }
          return [];
        }
      } else {
        const err = new InvalidQueryStringParameterError({ parameterName: 'versions' });
        if (callback) {
          return callback(err);
        }
        throw err;
      }
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
  }

  async retrieveVersionById(stixId, modified, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }
    if (!stixId) {
      const err = new MissingParameterError({ parameterName: 'stixId' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    if (!modified) {
      const err = new MissingParameterError({ parameterName: 'modified' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    try {
      const document = await this.repository.retrieveOneByVersion(stixId, modified);

      if (!document) {
        if (callback) {
          return callback(null, null);
        }
        return null;
      } else {
        try {
          await this.addCreatedByAndModifiedByIdentities(document);
        } catch (err) {
          const identityError = new IdentityServiceError({
            details: err.message,
            cause: err,
          });
          if (callback) {
            return callback(identityError);
          }
          throw identityError;
        }
        if (callback) {
          return callback(null, document);
        }
        return document;
      }
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
  }

  async create(data, options, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }

    if (data?.stix?.type !== this.type) {
      throw new InvalidTypeError();
    }

    try {
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
      const res = await this.repository.save(data);
      if (callback) {
        return callback(null, res);
      }
      return res;
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
  }

  async updateFull(stixId, stixModified, data, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }
    if (!stixId) {
      const err = new MissingParameterError({ parameterName: 'stixId' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    if (!stixModified) {
      const err = new MissingParameterError({ parameterName: 'modified' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    let document;
    try {
      document = await this.repository.retrieveOneByVersion(stixId, stixModified);
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    if (!document) {
      if (callback) {
        return callback(null, null);
      }
      return null;
    }

    try {
      const newDocument = await this.repository.updateAndSave(document, data);

      if (newDocument === document) {
        // Document successfully saved
        if (callback) {
          return callback(null, newDocument);
        }
        return newDocument;
      } else {
        const err = new DatabaseError({
          details: 'Document could not be saved',
          document, // Pass along the document that could not be saved
        });
        if (callback) {
          return callback(err);
        }
        throw err;
      }
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
  }

  // TODO rename to deleteVersionByStixId and repurpose the existing name for deleting by the document's unique _id
  async deleteVersionById(stixId, stixModified, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }
    if (!stixId) {
      const err = new MissingParameterError({ parameterName: 'stixId' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    if (!stixModified) {
      const err = new MissingParameterError({ parameterName: 'modified' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    try {
      const document = await this.repository.findOneAndDelete(stixId, stixModified);

      if (!document) {
        //Note: document is null if not found
        if (callback) {
          return callback(null, null);
        }
        return null;
      }
      if (callback) {
        return callback(null, document);
      }
      return document;
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
  }

  // TODO rename to deleteManyByStixId
  async deleteById(stixId, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }
    if (!stixId) {
      const err = new MissingParameterError({ parameterName: 'stixId' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    try {
      const res = await this.repository.deleteMany(stixId);
      if (callback) {
        return callback(null, res);
      }
      return res;
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
  }
}

module.exports = BaseService;
