'use strict';

const uuid = require('uuid');
const Software = require('../models/software-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');

const errors = {
    missingParameter: 'Missing required parameter',
    missingProperty: 'Missing required property',
    propertyNotAllowed: 'Includes property that is not allowed',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = function (options, callback) {
    // Build the query
    const query = {};
    if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
    }
    if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
    }
    if (!options.includeDeleted) {
        query['workspace.workflow.soft_delete'] = { $in: [null, false] };
    }
    if (typeof options.state !== 'undefined') {
        if (Array.isArray(options.state)) {
            query['workspace.workflow.state'] = { $in: options.state };
        }
        else {
            query['workspace.workflow.state'] = options.state;
        }
    }
    if (typeof options.domain !== 'undefined') {
        if (Array.isArray(options.domain)) {
            query['stix.x_mitre_domains'] = { $in: options.domain };
        }
        else {
            query['stix.x_mitre_domains'] = options.domain;
        }
    }
    if (typeof options.platform !== 'undefined') {
        if (Array.isArray(options.platform)) {
            query['stix.x_mitre_platforms'] = { $in: options.platform };
        }
        else {
            query['stix.x_mitre_platforms'] = options.platform;
        }
    }

    // Build the aggregation
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$document' } },
        { $sort: { 'stix.id': 1 } },
        { $match: query }
    ];

    if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = {
            $match: {
                $or: [
                    { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                    { 'stix.description': { '$regex': options.search, '$options': 'i' } },
                    { 'workspace.attack_id': { '$regex': options.search, '$options': 'i' } }
                ]
            }
        };
        aggregation.push(match);
    }

    const facet = {
        $facet: {
            totalCount: [{ $count: 'totalCount' }],
            documents: []
        }
    };
    if (options.offset) {
        facet.$facet.documents.push({ $skip: options.offset });
    }
    else {
        facet.$facet.documents.push({ $skip: 0 });
    }
    if (options.limit) {
        facet.$facet.documents.push({ $limit: options.limit });
    }
    aggregation.push(facet);

    // Retrieve the documents
    Software.aggregate(aggregation, function (err, results) {
        if (err) {
            return callback(err);
        }
        else {
            identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents)
                .then(function () {
                    if (options.includePagination) {
                        let derivedTotalCount = 0;
                        if (results[0].totalCount.length > 0) {
                            derivedTotalCount = results[0].totalCount[0].totalCount;
                        }
                        const returnValue = {
                            pagination: {
                                total: derivedTotalCount,
                                offset: options.offset,
                                limit: options.limit
                            },
                            data: results[0].documents
                        };
                        return callback(null, returnValue);
                    }
                    else {
                        return callback(null, results[0].documents);
                    }
                });
        }
    });
};

exports.retrieveById = function (stixId, options, callback) {
    // versions=all Retrieve all software with the stixId
    // versions=latest Retrieve the software with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Software.find({ 'stix.id': stixId })
            .lean()
            .exec(function (err, software) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    } else {
                        return callback(err);
                    }
                } else {
                    identitiesService.addCreatedByAndModifiedByIdentitiesToAll(software)
                        .then(() => callback(null, software));
                }
            });
    }
    else if (options.versions === 'latest') {
        Software.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function (err, software) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    // Note: document is null if not found
                    if (software) {
                        identitiesService.addCreatedByAndModifiedByIdentities(software)
                            .then(() => callback(null, [software]));
                    }
                    else {
                        return callback(null, []);
                    }
                }
            });
    }
    else {
        const error = new Error(errors.invalidQueryStringParameter);
        error.parameterName = 'versions';
        return callback(error);
    }
};

exports.retrieveVersionById = function (stixId, modified, options, callback) {
    // Retrieve the versions of the software with the matching stixId and modified date

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!modified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Software.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function (err, software) {
        if (err) {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else {
            // Note: document is null if not found
            if (software) {
                identitiesService.addCreatedByAndModifiedByIdentities(software)
                    .then(() => callback(null, software));
            }
            else {
                console.log('** NOT FOUND')
                return callback();
            }
        }
    });
};

exports.createIsAsync = true;
exports.create = async function (data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    // is_family defaults to true for malware, not allowed for tools
    if (data.stix && data.stix.type === 'malware' && typeof data.stix.is_family !== 'boolean') {
        data.stix.is_family = true;
    }
    else if (data.stix && data.stix.type === 'tool' && data.stix.is_family !== undefined) {
        const err = new Error(errors.propertyNotAllowed);
        err.propertyName = 'stix.is_family';
        throw err;
    }

    // Create the document
    const software = new Software(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        software.stix.x_mitre_attack_spec_version = software.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            software.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(software);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (software.stix.id) {
            existingObject = await Software.findOne({ 'stix.id': software.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            software.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            if (software.stix.type === 'tool') {
                software.stix.id = software.stix.id || `tool--${uuid.v4()}`;
            }
            else {
                software.stix.id = software.stix.id || `malware--${uuid.v4()}`;
            }

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            software.stix.created_by_ref = organizationIdentityRef;
            software.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedSoftware = await software.save();
        return savedSoftware;
    }
    catch(err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = function (stixId, stixModified, data, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        return callback(error);
    }

    Software.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else if (!document) {
            // document not found
            return callback(null);
        }
        else {
            // Copy data to found document and save
            Object.assign(document, data);
            document.save(function (err, savedDocument) {
                if (err) {
                    if (err.name === 'MongoServerError' && err.code === 11000) {
                        // 11000 = Duplicate index
                        var error = new Error(errors.duplicateId);
                        return callback(error);
                    }
                    else {
                        return callback(err);
                    }
                }
                else {
                    return callback(null, savedDocument);
                }
            });
        }
    });
};

exports.deleteById = attackObjectsService.makeDeleteByIdSync(Software);
exports.deleteVersionById = attackObjectsService.makeDeleteVersionByIdSync(Software);
