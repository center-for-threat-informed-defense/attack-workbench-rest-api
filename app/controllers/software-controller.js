'use strict';

const softwareService = require('../services/software-service');
const logger = require('../lib/logger');
const { DuplicateIdError, BadlyFormattedParameterError, InvalidQueryStringParameterError, MissingPropertyError, PropertyNotAllowedError } = require('../exceptions');

exports.retrieveAll = async function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        domain: req.query.domain,
        platform: req.query.platform,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        lastUpdatedBy: req.query.lastUpdatedBy,
        includePagination: req.query.includePagination
    }
    try {
        const res = await softwareService.retrieveAll(options);
        if (options.includePagination) {
            logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total software`);
        }
        else {
            logger.debug(`Success: Retrieved ${ results.length } software`);
        }
        return res.status(200).send(results);
    } catch (err) {
        logger.error('Failed with error: ' + err);
        return res.status(500).send('Unable to get software. Server error.');
    }
};

exports.retrieveById = async function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }
    try {
        const software = await softwareService.retrieveById(req.params.stixId, options);
        if (software.length === 0) {
            return res.status(404).send('Software not found.');
        }
        else {
            logger.debug(`Success: Retrieved ${ software.length } software with id ${ req.params.stixId }`);
            return res.status(200).send(software);
        }
        
    }  catch (err) {
        if (err instanceof BadlyFormattedParameterError) {
            logger.warn('Badly formatted stix id: ' + req.params.stixId);
            return res.status(400).send('Stix id is badly formatted.');
        }
        else if (err instanceof InvalidQueryStringParameterError) {
            logger.warn('Invalid query string: versions=' + req.query.versions);
            return res.status(400).send('Query string parameter versions is invalid.');
        }
        else {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get software. Server error.');
        }
    }

};

exports.retrieveVersionById = async function(req, res) {
    try {
        const software = await softwareService.retrieveVersionById(req.params.stixId, req.params.modified);

        if (!software) {
            return res.status(404).send('Software not found.');
        }
        else {
            logger.debug(`Success: Retrieved software with id ${software.id}`);
            return res.status(200).send(software);
        }
    } catch (err) {

        if (err instanceof BadlyFormattedParameterError) {
            logger.warn('Badly formatted stix id: ' + req.params.stixId);
            return res.status(400).send('Stix id is badly formatted.');
        }
        else {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get software. Server error.');
        }
    }

};

exports.create = async function(req, res) {
    // Get the data from the request
    const softwareData = req.body;

    const options = {
        import: false,
        userAccountId: req.user?.userAccountId
    };

    // Create the software
    try {
        const software = await await softwareService.create(softwareData, options);
        logger.debug("Success: Created software with id " + software.stix.id);
        return res.status(201).send(software);
    }
    catch(err) {
        if (err instanceof DuplicateIdError) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create software. Duplicate stix.id and stix.modified properties.');
        }
        else if (err instanceof MissingPropertyError) {
            logger.warn(`Unable to create software, missing property ${ err.propertyName }`);
            return res.status(400).send(`Unable to create software, missing property ${ err.propertyName }`);
        }
        else if (err instanceof PropertyNotAllowedError) {
            logger.warn(`Unable to create software, property ${ err.propertyName } is not allowed`);
            return res.status(400).send(`Unable to create software, property ${ err.propertyName } is not allowed`);
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create software. Server error.");
        }
    }
};

exports.updateFull = async function(req, res) {
    // Get the data from the request
    const softwareData = req.body;

    // Create the software
    await softwareService.updateFull(req.params.stixId, req.params.modified, softwareData, async function(err, software) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update software. Server error.");
        }
        else {
            if (!software) {
                return res.status(404).send('Software not found.');
            } else {
                logger.debug("Success: Updated software with id " + software.stix.id);
                return res.status(200).send(software);
            }
        }
    });
};

exports.deleteVersionById = async function(req, res) {
    try {
        const software = await softwareService.deleteVersionById(req.params.stixId, req.params.modified);

        if (!software) {
            return res.status(404).send('Software not found.');
        } else {
            logger.debug("Success: Deleted software with id " + software.stix.id);
            return res.status(204).end();
        }
        
    } catch (err) {
        logger.error('Delete software failed. ' + err);
        return res.status(500).send('Unable to delete software. Server error.');
    }
};

exports.deleteById = async function(req, res) {
    try {
        const softwares = await softwareService.deleteById(req.params.stixId);

        if (softwares.deletedCount === 0) {
            return res.status(404).send('Software not found.');
        }
        else {
            logger.debug(`Success: Deleted software with id ${ req.params.stixId }`);
            return res.status(204).end();
        }

    } catch (err) {
        logger.error('Delete software failed. ' + err);
        return res.status(500).send('Unable to delete software. Server error.');
    }
};
