'use strict';

const { NotImplementedError } = require('../exceptions');
const Relationship = require('../models/relationship-model');
const attackObjectsRepository = require('../repository/attack-objects-repository');
const BaseService = require('./_base.service');

class AttackObjectsService extends BaseService {

    systemConfigurationService = require('./system-configuration-service');

    relationshipPrefix = 'relationship';

    retrieveById(stixId, options, callback) {
        throw new NotImplementedError(this.constructor.name, 'retrieveById');
    }

    create(data, options, callback) {
        throw new NotImplementedError(this.constructor.name, 'create');
    }

    updateFull(stixId, stixModified, data, callback) {
        throw new NotImplementedError(this.constructor.name, 'updateFull');
    }

    deleteVersionById(stixId, stixModified, callback) {
        throw new NotImplementedError(this.constructor.name, 'deleteVersionById');
    }

    deleteById(stixId, callback) {
        throw new NotImplementedError(this.constructor.name, 'deleteById');
    }

    // Record that this object is part of a collection
    async insertCollection(stixId, modified, collectionId, collectionModified) {
        let attackObject;
        if (stixId.startsWith(this.relationshipPrefix)) {
            // TBD: Use relationships service when that is converted to async
            attackObject = await Relationship.findOne({ 'stix.id': stixId, 'stix.modified': modified });
        }
        else {
            attackObject = await this.repository.retrieveOneByVersion(stixId, modified);
        }

        if (attackObject) {
            // Create the collection reference
            const collection = {
                collection_ref: collectionId,
                collection_modified: collectionModified
            };

            // Make sure the exports array exists and add the collection reference
            if (!attackObject.workspace.collections) {
                attackObject.workspace.collections = [];
            }

            // Check to see if the collection is already added
            // (collection with same id and version should only be created--and therefore objects added--one time)
            const duplicateCollection = attackObject.workspace.collections.find(
                item => item.collection_ref === collection.collection_ref && item.collection_modified === collection.collection_modified);
            if (duplicateCollection) {
                throw new Error(this.errors.duplicateCollection);
            }

            attackObject.workspace.collections.push(collection);

            await attackObject.save();
        }
        else {
            throw new Error(this.errors.notFound);
        }
    }

    async setDefaultMarkingDefinitions(attackObject) {
        // Add any default marking definitions that are not in the current list for this object
        const defaultMarkingDefinitions = await this.systemConfigurationService.retrieveDefaultMarkingDefinitions({ refOnly: true });
        if (attackObject.stix.object_marking_refs) {
            attackObject.stix.object_marking_refs = attackObject.stix.object_marking_refs.concat(defaultMarkingDefinitions.filter(e => !attackObject.stix.object_marking_refs.includes(e)));
        }
        else {
            attackObject.stix.object_marking_refs = defaultMarkingDefinitions;
        }
    }
}

module.exports = new AttackObjectsService(null, attackObjectsRepository);