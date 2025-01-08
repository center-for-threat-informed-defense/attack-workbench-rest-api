'use strict';

const uuid = require('uuid');
const systemConfigurationService = require('./system-configuration-service');
const config = require('../config/config');
const userAccountsService = require('./user-accounts-service');
const identitiesRepository = require('../repository/identities-repository');
const BaseService = require('./_base.service');
const { InvalidTypeError } = require('../exceptions');
const { Identity: IdentityType } = require('../lib/stix-types');

class IdentitiesService extends BaseService {
  async addCreatedByAndModifiedByIdentitiesToAll(attackObjects) {
    const identityCache = new Map();
    const userAccountCache = new Map();
    for (const attackObject of attackObjects) {
      // eslint-disable-next-line no-await-in-loop
      await this.addCreatedByAndModifiedByIdentities(attackObject, identityCache, userAccountCache);
    }
  }

  async create(data, options) {
    // This function overrides the base class create() because
    //   1. It does not set the created_by_ref or x_mitre_modified_by_ref properties
    //   2. It does not check for an existing identity object

    if (data?.stix?.type !== identityType) {
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
      await systemConfigurationService.setDefaultMarkingDefinitionsForObject(data);

      // Assign a new STIX id if not already provided
      data.stix.id = data.stix.id || `identity--${uuid.v4()}`;
    }

    // Save the document in the database
    const savedIdentity = await this.repository.save(data);
    return savedIdentity;
  }

module.exports = new IdentitiesService(IdentityType, identitiesRepository);
