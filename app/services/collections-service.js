'use strict';

const asyncLib = require('async');
const superagent = require('superagent');
const identitiesService = require('../services/identities-service');
const Collection = require('../models/collection-model');
const AttackObject = require('../models/attack-object-model');
const attackObjectsService = require('./attack-objects-service');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');



const collectionsRepository = require('../repository/collections-repository');

const BaseService = require('./_base.service');
const { MissingParameterError, NotFoundError, BadlyFormattedParameterError, DuplicateIdError } = require('../exceptions');

class CollectionsService extends BaseService {

    errors = {
        missingParameter: 'Missing required parameter',
        badRequest: 'Bad request',
        invalidFormat: 'Invalid format',
        badlyFormattedParameter: 'Badly formatted parameter',
        duplicateId: 'Duplicate id',
        notFound: 'Document not found',
        hostNotFound: 'Host not found',
        connectionRefused: 'Connection refused',
        unauthorized: 'Unauthorized',
        invalidQueryStringParameter: 'Invalid query string parameter'
    };


    createIsAsync = true;
    async create(data, options) {
        // Create the document

        // Save the document in the database
        let insertionErrors = [];
        try {
            const savedCollection = await super.create(data, options);

            if (options.addObjectsToCollection) {
                insertionErrors = await this.addObjectsToCollection(savedCollection.stix.x_mitre_contents, savedCollection.stix.id, savedCollection.stix.modified);
            }

            return { savedCollection, insertionErrors };
        }
        catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                throw new DuplicateIdError;
            }
            else {
                throw err;
            }
        }
    };

    async retrieveVersionById (stixId, modified, options, callback) {
        // Retrieve the versions of the collection with the matching stixID and modified date
    
        if (!stixId) {
            if (callback) {
                return callback(new Error(this.errors.missingParameter));
            }
       
            throw new MissingParameterError;
        }
    
        if (!modified) {
            if (callback) {
                return callback(new Error(this.errors.missingParameter));
            }
            throw new MissingParameterError;
        }
    
        try {
            const collection = await this.repository.model.findOne({ 'stix.id': stixId, 'stix.modified': modified }).lean().exec();
    
            if (collection) {
                if (options.retrieveContents) {
                    const contents = await this.getContents(collection.stix.x_mitre_contents);
                    collection.contents = contents;
                }
    
                await identitiesService.addCreatedByAndModifiedByIdentities(collection);
                if (callback) {
                    return callback(null, collection);
                }
                return collection;
            } else {
                if (callback) {
                    return callback;
                }
                return;
            }
        } catch (err) {
            if (err.name === 'CastError') {
                if (callback) {
                    return callback(new Error(this.errors.badlyFormattedParameter));
                }
                throw new BadlyFormattedParameterError;
            } else {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
        }
    };

    async retrieveById (stixId, options) {
        if (!stixId) {
            throw new MissingParameterError('stixId');
        }
    
        if (options.versions === 'all') {
            try {
                const collections = await this.repository.model.find({'stix.id': stixId}).lean().exec();
    
                if (options.retrieveContents) {
                    await asyncLib.eachSeries(collections, async function (collection) {
                        const contents = await this.getContents(collection.stix.x_mitre_contents);
                        collection.contents = contents;
                    });
                }
    
                return collections;
            } catch (err) {
                if (err.name === 'CastError') {
                    throw new BadlyFormattedParameterError('stixId');
                } else {
                    throw err;
                }
            }
        } else if (options.versions === 'latest') {
            try {
                const collection = await this.repository.model.findOne({'stix.id': stixId}).sort('-stix.modified').lean().exec();
    
                if (collection) {
                    if (options.retrieveContents) {
                        const contents = await this.getContents(collection.stix.x_mitre_contents);
                        collection.contents = contents;
                        return [collection];
                    } else {
                        return [collection];
                    }
                } else {
                    return [];
                }
            } catch (err) {
                if (err.name === 'CastError') {
                    throw new BadlyFormattedParameterError('stixId');
                } else {
                    throw err;
                }
            }
        } else {
            const error = new Error(errors.invalidQueryStringParameter);
            error.parameterName = 'versions';
            throw error;
        }
    };

    async getContents(objectList) {
        asyncLib.mapLimit(
            objectList,
            5,
            async function(objectRef) {
                const attackObject = await attackObjectsService.retrieveVersionById(objectRef.object_ref, objectRef.object_modified);
                return attackObject;
            },
            function(err, results) {
                if (err) {
                    throw err;
                }
                else {
                    const filteredResults = results.filter(item => item);
                    return filteredResults;
                }
            });
    }


    async addObjectsToCollection(objectList, collectionID, collectionModified) {
        // Modify the objects in the collection to show that they are part of the collection
        const insertionErrors = [];
        for (const attackObject of objectList) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await attackObjectsService.insertCollection(attackObject.object_ref, attackObject.object_modified, collectionID, collectionModified);
            }
            catch(err) {
                insertionErrors.push(err);
            }
        }

        return insertionErrors;
    }


    async delete(stixId, deleteAllContents) {
        if (!stixId) {
            throw new MissingParameterError;
        }

        const collections = await Collection.find({'stix.id': stixId}).lean();
        if (!collections) {
            throw new BadlyFormattedParameterError;
        }

        if (deleteAllContents) {
            for (const collection of collections) {
                await deleteAllContentsOfCollection(collection, stixId);
            }
        }

        const allCollections = await Collection.find({'stix.id': stixId}).lean();
        const removedCollections = [];
        for (const collection of allCollections) {
            try {
                await Collection.findByIdAndDelete(collection._id).lean();
            } catch (err) {
                continue;
            }
            removedCollections.push(collection);
        }
        return removedCollections;
    };


    async deleteAllContentsOfCollection(collection, stixId, modified) {
        for (const reference of collection.stix.x_mitre_contents) {
            const referenceObj = await AttackObject.findOne({ 'stix.id': reference.object_ref, 'stix.modified': reference.object_modified }).lean();
            if (!referenceObj) { continue;}
            const matchQuery = {'stix.id': {'$ne': stixId}, 'stix.x_mitre_contents' : {'$elemMatch' : {'object_ref' : reference.object_ref, 'object_modified': reference.object_modified}}};
            if (modified) {
                delete matchQuery['stix.id'];
                matchQuery['$or'] = [{'stix.id': {'$ne': stixId}},{'stix.modified': {'$ne': modified}}];
            }
            const matches = await Collection.find(matchQuery).lean();
            if (matches.length === 0) {
                // if this attack object is NOT in another collection, we can just delete it
                await AttackObject.findByIdAndDelete(referenceObj._id);
            } else {
                // if this object IS in another collection, we need to update the workspace.collections array
                if (referenceObj.workspace && referenceObj.workspace.collections) {
                    const newCollectionsArr = referenceObj.workspace.collections.filter(collectionElem => collectionElem.collection_ref !== stixId);
                    await AttackObject.findByIdAndUpdate(referenceObj.id, {'workspace.collections' : newCollectionsArr});
                } 
            }
        }
    }

    async insertExport(stixId, modified, exportData) {
        const collection = await Collection.findOne({ 'stix.id': stixId, 'stix.modified': modified });

        if (collection) {
            // Make sure the exports array exists
            if (!collection.workspace.exported) {
                collection.workspace.exported = [];
            }
            collection.workspace.exported.push(exportData);

            await collection.save();
        }
        else {
            throw new NotFoundError;
        }
    };

    async deleteVersionById (stixId, modified, deleteAllContents, callback) {
        if (!stixId) {
            if (callback) {
                return callback(new Error(this.errors.missingParameter));
            }
            throw new MissingParameterError;
        }
    
        const collection = await Collection.findOne({'stix.id': stixId, 'stix.modified': modified}).lean();
        if (!collection) {
            if (callback) {
                return callback(new Error(this.errors.missingParameter));
            }
            throw new MissingParameterError;
        }
    
        if (deleteAllContents) {
            await this.deleteAllContentsOfCollection(collection, stixId, modified);
        }
    
        try {
            await Collection.findByIdAndDelete(collection._id).lean();
        } catch (err) {
            // Handle deletion error if needed
        }
        if (callback) {
            return callback(null, collection);
        }
        return collection;
    };
    

    async retrieveByUrl(url) {
        if (!url) {
            const error = new MissingParameterError;
            throw error;
        }
        try {
        const res = await superagent.get(url);
            try {
                const body = JSON.parse(res.text);
                return body;
            } catch (err) {
                const error = new Error(this.errors.invalidFormat);
                throw error;
            }
        }    
        catch (err) {
            if (err.response && err.response.notFound) {
                const error = new NotFoundError
                throw error;
            }
            else if (err.response && err.response.badRequest) {
                const error = new Error(this.errors.badRequest);
                throw error;
            }
            else if (err.code === 'ENOTFOUND') {
                const error = new Error(this.errors.hostNotFound);
                throw error;
            }
            else if (err.code === 'ECONNREFUSED') {
                const error = new Error(this.errors.connectionRefused);
                throw error;
            }
            else {
                throw err;
            }
        }
    };

}

module.exports = new CollectionsService('x-mitre-collection', collectionsRepository);