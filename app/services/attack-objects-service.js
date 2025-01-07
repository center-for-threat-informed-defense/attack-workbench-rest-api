'use strict';

const Relationship = require('../models/relationship-model');
const attackObjectsRepository = require('../repository/attack-objects-repository');
const BaseService = require('./_base.service');

const identitiesService = require('./identities-service');
const relationshipsService = require('./relationships-service');

const { DatabaseError, IdentityServiceError, NotImplementedError } = require('../exceptions');

class AttackObjectsService extends BaseService {

    async retrieveAll(options, callback) {
        if (AttackObjectsService.isCallback(arguments[arguments.length - 1])) {
            callback = arguments[arguments.length - 1];
        }

        let results;
        try {
            results = await this.repository.retrieveAll(options);
        } catch (err) {
            const databaseError = new DatabaseError(err); // Let the DatabaseError bubble up
            if (callback) {
                return callback(databaseError);
            }
            throw databaseError;
        }

        try {
            await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);
        } catch (err) {
            const identityError = new IdentityServiceError({
                details: err.message,
                cause: err
            });
            if (callback) {
                return callback(identityError);
            }
            throw identityError;
        }
        // Add relationships from separate collection
        if (!options.attackId && !options.search) {
            const relationshipsOptions = {
                includeRevoked: options.includeRevoked,
                includeDeprecated: options.includeDeprecated,
                state: options.state,
                versions: options.versions,
                lookupRefs: false,
                includeIdentities: false,
                lastUpdatedBy: options.lastUpdatedBy
            };
            const relationships = await relationshipsService.retrieveAll(relationshipsOptions);
            if (relationships.length > 0) {
                results[0].documents = results[0].documents.concat(relationships);
                results[0].totalCount[0].totalCount += 1;
            }
        }

        const paginatedResults = AttackObjectsService.paginate(options, results);
        if (callback) {
            return callback(null, paginatedResults);
        }
        return paginatedResults;
    }

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
        if (stixId.startsWith('relationship')) {
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
}

module.exports = new AttackObjectsService('not-a-valid-type', attackObjectsRepository);