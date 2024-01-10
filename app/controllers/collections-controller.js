'use strict';

const collectionsService = require('../services/collections-service');
const logger = require('../lib/logger');
const { BadlyFormattedParameterError, InvalidQueryStringParameterError, DuplicateIdError } = require('../exceptions');

exports.retrieveAll = async function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        versions: req.query.versions || 'latest',
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        lastUpdatedBy: req.query.lastUpdatedBy,
    }
    try {
        const collections = await collectionsService.retrieveAll(options);
        logger.debug(`Success: Retrieved ${ collections.length } collection(s)`);
        return res.status(200).send(collections);
    }
    catch (err) {
        console.log("retrieve all error");
        console.log(err);
        logger.error('Failed with error: ' + err);
        return res.status(500).send('Unable to get collections. Server error.');
    }

};

exports.retrieveById = async function(req, res) {
    const options = {
        versions: req.query.versions || 'latest',
        retrieveContents: req.query.retrieveContents
    }

    try {
        const collections = await collectionsService.retrieveById(req.params.stixId, options);
        if (collections.length === 0) {
            return res.status(404).send('Collection not found.');
        }
        else {
            logger.debug(`Success: Retrieved ${ collections.length } collection(s) with id ${ req.params.stixId }`);
            return res.status(200).send(collections);
        }
    } 
    catch (err) {
        if (err instanceof BadlyFormattedParameterError) {
            logger.warn('Badly formatted stix id: ' + req.params.stixId);
            return res.status(400).send('Stix id is badly formatted.');
        }
        else if (err instanceof InvalidQueryStringParameterError) {
            logger.warn('Invalid query string: versions=' + req.query.versions);
            return res.status(400).send('Query string parameter versions is invalid.');
        }
        else {
            console.log("retrieveby id error");
            console.log(err);
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get collections. Server error.');
        }
    }
};

exports.retrieveVersionById = async function(req, res) {
    const options = {
        retrieveContents: req.query.retrieveContents
    }
    try {
        const collection = await collectionsService.retrieveVersionById(req.params.stixId, req.params.modified, options);
        if (!collection) {
            return res.status(404).send('Collection not found.');
        }
        else {
            logger.debug(`Success: Retrieved collection with id ${collection.id}`);
            return res.status(200).send(collection);
        }
    } catch (err) {
        if (err instanceof BadlyFormattedParameterError) {
            logger.warn('Badly formatted stix id: ' + req.params.stixId);
            return res.status(400).send('Stix id is badly formatted.');
        }
        else {
            console.log("retrieve version by id error");
            console.log(err);
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get collections. Server error.');
        }
    } 
}

exports.create = async function(req, res) {
    // Get the data from the request
    const collectionData = req.body;

    // Create the collection
    const options = {
        addObjectsToCollection: true,
        import: false,
        userAccountId: req.user?.userAccountId
    };
    try {
        const { savedCollection, insertionErrors } = await collectionsService.create(collectionData, options);
        logger.debug('Success: Created collection with id ' + savedCollection.stix.id);
        if (insertionErrors.length > 0) {
            logger.info(`There were ${ insertionErrors.length } errors while marking the objects in the collection.`);
        }
        return res.status(201).send(savedCollection);
    }
    catch(err) {
        if (err instanceof DuplicateIdError) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create collection. Duplicate stix.id and stix.modified properties.');
        }
        else {
            console.log("create error");
            console.log(err);
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create collection. Server error.");
        }
    }
};

exports.delete = async function(req, res) {
    try {
        const removedCollections = await collectionsService.delete(req.params.stixId, req.query.deleteAllContents);
        if (removedCollections.length === 0) {
            return res.status(404).send('Collection not found.');
        } else {
            logger.debug("Success: Deleted collection with id " + removedCollections[0].id);
            return res.status(204).end();
        }
    } catch (error) {
        console.log("delete error");
        console.log(err);
        logger.error('Delete collections failed. ' + error);
        return res.status(500).send('Unable to delete collections. Server error.');
    }
};


exports.deleteVersionById = async function(req, res) {
    try {
        const removedCollection = await collectionsService.deleteVersionById(req.params.stixId, req.params.modified, req.query.deleteAllContents);
        if (!removedCollection) {
            return res.status(404).send('Collection not found.');
        } else {
            logger.debug("Success: Deleted collection with id " + removedCollection.id);
            return res.status(204).end();
        }
    } catch (error) {
        console.log(error);
        console.log("delete version by id error");
        logger.error('Delete collection failed. ' + error);
        return res.status(500).send('Unable to delete collection. Server error.');
    }
};
