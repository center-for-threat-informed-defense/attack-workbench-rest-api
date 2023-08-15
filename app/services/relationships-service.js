'use strict';

const uuid = require('uuid');
const Relationship = require('../models/relationship-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');

const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

// Map STIX types to ATT&CK types
const objectTypeMap = new Map();
objectTypeMap.set('malware', 'software');
objectTypeMap.set('tool', 'software');
objectTypeMap.set('attack-pattern', 'technique');
objectTypeMap.set('intrusion-set', 'group');
objectTypeMap.set('campaign', 'campaign');
objectTypeMap.set('course-of-action', 'mitigation');
objectTypeMap.set('x-mitre-tactic', 'tactic');
objectTypeMap.set('x-mitre-matrix', 'matrix');
objectTypeMap.set('x-mitre-data-component', 'data-component');

exports.retrieveAll = async function(options) {
    // Build the query
    const query = {};
    if (!options.includeRevoked) {
        query['stix.revoked'] = { $in: [null, false] };
    }
    if (!options.includeDeprecated) {
        query['stix.x_mitre_deprecated'] = { $in: [null, false] };
    }
    if (typeof options.state !== 'undefined') {
        if (Array.isArray(options.state)) {
            query['workspace.workflow.state'] = { $in: options.state };
        }
        else {
            query['workspace.workflow.state'] = options.state;
        }
    }
    if (typeof options.sourceRef !== 'undefined') {
        query['stix.source_ref'] = options.sourceRef;
    }
    if (typeof options.targetRef !== 'undefined') {
        query['stix.target_ref'] = options.targetRef;
    }
    if (typeof options.sourceOrTargetRef !== 'undefined') {
        query.$or = [{ 'stix.source_ref': options.sourceOrTargetRef }, { 'stix.target_ref': options.sourceOrTargetRef }]
    }
    if (typeof options.relationshipType !== 'undefined') {
        query['stix.relationship_type'] = options.relationshipType;
    }
    if (typeof options.lastUpdatedBy !== 'undefined') {
        query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
    }

    // Build the aggregation
    const aggregation = [];
    if (options.versions === 'latest') {
        // - Group the documents by stix.id, sorted by stix.modified
        // - Use the last document in each group (according to the value of stix.modified)
        aggregation.push({ $sort: { 'stix.id': 1, 'stix.modified': 1 } });
        aggregation.push({ $group: { _id: '$stix.id', document: { $last: '$$ROOT' } } });
        aggregation.push({ $replaceRoot: { newRoot: '$document' } });
    }

    // Add stages to the aggregation to sort (for pagination), apply the query, and add source and target object data
    aggregation.push({ $sort: { 'stix.id': 1 } });
    aggregation.push({ $match: query });
    if (options.lookupRefs) {
        aggregation.push({
            $lookup: {
                from: 'attackObjects',
                localField: 'stix.source_ref',
                foreignField: 'stix.id',
                as: 'source_objects'
            }
        });
        aggregation.push({
            $lookup: {
                from: 'attackObjects',
                localField: 'stix.target_ref',
                foreignField: 'stix.id',
                as: 'target_objects'
            }
        });
    }
    // Retrieve the documents
    let results = await Relationship.aggregate(aggregation);

    // Filter out relationships that don't reference the source type
    if (options.sourceType) {
        results = results.filter(document => {
            if (document.source_objects.length === 0) {
                return false;
            }
            else {
                document.source_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                return objectTypeMap.get(document.source_objects[0].stix.type) === options.sourceType;
            }
        });
    }

    // Filter out relationships that don't reference the target type
    if (options.targetType) {
        results = results.filter(document => {
            if (document.target_objects.length === 0) {
                return false;
            }
            else {
                document.target_objects.sort((a, b) => b.stix.modified - a.stix.modified);
                return objectTypeMap.get(document.target_objects[0].stix.type) === options.targetType;
            }
        });
    }

    const prePaginationTotal = results.length;

    // Apply pagination parameters
    if (options.offset || options.limit) {
        const start = options.offset || 0;
        if (options.limit) {
            const end = start + options.limit;
            results = results.slice(start, end);
        }
        else {
            results = results.slice(start);
        }
    }

    // Move latest source and target objects to a non-array property, then remove array of source and target objects
    for (const document of results) {
        if (Array.isArray(document.source_objects)) {
            if (document.source_objects.length === 0) {
                document.source_objects = undefined;
            }
            else {
                document.source_object = document.source_objects[0];
                document.source_objects = undefined;
            }
        }

        if (Array.isArray(document.target_objects)) {
            if (document.target_objects.length === 0) {
                document.target_objects = undefined;
            }
            else {
                document.target_object = document.target_objects[0];
                document.target_objects = undefined;
            }
        }
    }

    if (options.includeIdentities) {
        await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results);
    }

    if (options.includePagination) {
        return {
            pagination: {
                total: prePaginationTotal,
                offset: options.offset,
                limit: options.limit
            },
            data: results
        };
    }
    else {
        return results;
    }
};

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all relationships with the stixId
    // versions=latest Retrieve the relationship with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Relationship
            .find({'stix.id': stixId})
            .sort('-stix.modified')
            .lean()
            .exec(function (err, relationships) {
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
                    identitiesService.addCreatedByAndModifiedByIdentitiesToAll(relationships)
                        .then(() => callback(null, relationships));
                }
            });
    }
    else if (options.versions === 'latest') {
        Relationship.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, relationship) {
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
                    if (relationship) {
                        identitiesService.addCreatedByAndModifiedByIdentities(relationship)
                            .then(() => callback(null, [ relationship ]));
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

exports.retrieveVersionById = function(stixId, modified, callback) {
    // Retrieve the version of the relationship with the matching stixId and modified date

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

    Relationship.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function(err, relationship) {
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
            if (relationship) {
                identitiesService.addCreatedByAndModifiedByIdentities(relationship)
                    .then(() => callback(null, relationship));
            }
            else {
                console.log('** NOT FOUND')
                return callback();
            }
        }
    });
};

exports.createIsAsync = true;
exports.create = async function(data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    // Create the document
    const relationship = new Relationship(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        relationship.stix.x_mitre_attack_spec_version = relationship.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            relationship.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(relationship);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (relationship.stix.id) {
            existingObject = await Relationship.findOne({ 'stix.id': relationship.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            relationship.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            relationship.stix.id = relationship.stix.id || `relationship--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            relationship.stix.created_by_ref = organizationIdentityRef;
            relationship.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedRelationshipe = await relationship.save();
        return savedRelationshipe;
    }
    catch (err) {
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

exports.updateFull = function(stixId, stixModified, data, callback) {
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

    Relationship.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
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
            document.save(function(err, savedDocument) {
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

exports.deleteVersionById = function (stixId, stixModified, callback) {
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

    Relationship.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, relationship) {
        if (err) {
            return callback(err);
        } else {
            //Note: relationship is null if not found
            return callback(null, relationship);
        }
    });
};

exports.deleteById = function (stixId, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    Relationship.deleteMany({ 'stix.id': stixId }, function (err, relationship) {
        if (err) {
            return callback(err);
        } else {
            //Note: relationship is null if not found
            return callback(null, relationship);
        }
    });
};
