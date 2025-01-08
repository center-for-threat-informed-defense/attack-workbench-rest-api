'use strict';

const uuid = require('uuid');
const config = require('../config/config');
const identitiesRepository = require('../repository/identities-repository');
const BaseService = require('./_base.service');
const { InvalidTypeError } = require('../exceptions');
const { Identity: IdentityType } = require('../lib/stix-types');

class IdentitiesService extends BaseService {
  /**
   * @public
   * CRUD Operation: Create
   *
   * Creates a new identity object
   *
   * Override of base class create() because:
   * 1. Does not set created_by_ref or x_mitre_modified_by_ref
   * 2. Does not check for existing identity object
   */
  async create(data, options) {
    if (data?.stix?.type !== IdentityType) {
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

      // Assign a new STIX id if not already provided
      data.stix.id = data.stix.id || `identity--${uuid.v4()}`;
    }

    // Save the document in the database
    try {
      return await this.repository.save(data);
    } catch (err) {
      th
    }
  }

  /**
   * @public
   * CRUD Operation: Read
   * Inherited from BaseService
   * retrieveAll(options)
   */

  /**
   * @public
   * CRUD Operation: Read
   * Inherited from BaseService
   * retrieveById(stixId, options)
   */

  /**
   * @public
   * CRUD Operation: Read
   * Inherited from BaseService
   * retrieveVersionById(stixId, modified)
   */

  /**
   * @public
   * CRUD Operation: Update
   * Inherited from BaseService
   * updateFull(stixId, modified, data)
   */

  /**
   * @public
   * CRUD Operation: Delete
   * Inherited from BaseService
   * deleteVersionById(stixId, modified)
   */

  /**
   * @public
   * CRUD Operation: Delete
   * Inherited from BaseService
   * deleteById(stixId)
   */
}

// Export an instance of the service
module.exports = new IdentitiesService(IdentityType, identitiesRepository);
