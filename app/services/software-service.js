'use strict';

const uuid = require('uuid');
const systemConfigurationService = require('./system-configuration-service');
const config = require('../config/config');

const { PropertyNotAllowedError, InvalidTypeError } = require('../exceptions');

const BaseService = require('./_base.service');
const softwareRepository = require('../repository/software-repository');

class SoftwareService extends BaseService {
  async create(data, options, callback) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    // is_family defaults to true for malware, not allowed for tools
    try {
      if (data?.stix?.type !== 'malware' && data?.stix?.type !== 'tool') {
        throw new InvalidTypeError();
      }

      if (data.stix && data.stix.type === 'malware' && typeof data.stix.is_family !== 'boolean') {
        data.stix.is_family = true;
      } else if (data.stix && data.stix.type === 'tool' && data.stix.is_family !== undefined) {
        throw new PropertyNotAllowedError();
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

        // Get the organization identity
        const organizationIdentityRef =
          await systemConfigurationService.retrieveOrganizationIdentityRef();

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
            // const stixIdPrefix = getStixIdPrefixFromModel(this.model.modelName, data.stix.type);
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
}

module.exports = new SoftwareService(null, softwareRepository);
