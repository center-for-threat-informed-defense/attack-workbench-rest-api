'use strict';

const uuid = require('uuid');
const BaseService = require('./_base.service');
const relationshipsRepository = require('../repositories/relationships-repository');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const { MissingParameterError, InvalidQueryStringParameterError } = require('../exceptions');

class RelationshipsService extends BaseService {

    async retrieveAll(options) {
        const results = await this.repository.retrieveAll(options);

        if (options.includeIdentities) {
            await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results);
        }

        return BaseService.paginate(options, [{ documents: results, totalCount: [{ totalCount: results.length }] }]);
    }

    async retrieveById(stixId, options) {
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }

        let relationships;
        if (options.versions === 'all') {
            relationships = await this.repository.retrieveAllById(stixId);
        } else if (options.versions === 'latest') {
            const relationship = await this.repository.retrieveLatestByStixId(stixId);
            relationships = relationship ? [relationship] : [];
        } else {
            throw new InvalidQueryStringParameterError({ parameterName: 'versions' });
        }

        if (options.includeIdentities) {
            await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(relationships);
        }

        return relationships;
    }

    async retrieveVersionById(stixId, modified) {
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }
        if (!modified) {
            throw new MissingParameterError({ parameterName: 'modified' });
        }

        const relationship = await this.repository.retrieveOneByVersion(stixId, modified);

        if (relationship) {
            await identitiesService.addCreatedByAndModifiedByIdentities(relationship);
        }

        return relationship;
    }

    async create(data, options = {}) {
        if (!options.import) {
            data = await this._prepareNewRelationship(data, options);
        }

        return await super.create(data, options);
    }

    async _prepareNewRelationship(data, options) {
        data.stix.x_mitre_attack_spec_version = data.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        if (options.userAccountId) {
            data.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        await attackObjectsService.setDefaultMarkingDefinitions(data);

        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        const existingObject = data.stix.id ? await this.repository.retrieveOneById(data.stix.id) : null;

        if (existingObject) {
            data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        } else {
            data.stix.id = data.stix.id || `{this.type}--${uuid.v4()}`;
            data.stix.created_by_ref = organizationIdentityRef;
            data.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }

        return data;
    }
}

module.exports = new RelationshipsService('relationship', relationshipsRepository);