'use strict';

const uuid = require('uuid');
const DataSource = require('../models/data-source-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const dataComponentsService = require('./data-components-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = function(options, callback) {
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

    // Build the aggregation
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}},
        { $replaceRoot: { newRoot: '$document' }},
        { $sort: { 'stix.id': 1 }},
        { $match: query }
    ];

    if (typeof options.search !== 'undefined') {
        const match = { $match: { $or: [
                    { 'stix.name': { '$regex': options.search, '$options': 'i' }},
                    { 'stix.description': { '$regex': options.search, '$options': 'i' }},
                    { 'workspace.attack_id': { '$regex': options.search, '$options': 'i' }}
                ]}};
        aggregation.push(match);
    }

    const facet = {
        $facet: {
            totalCount: [ { $count: 'totalCount' }],
            documents: [ ]
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
    DataSource.aggregate(aggregation, function(err, results) {
        if (err) {
            return callback(err);
        }
        else {
            identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents)
                .then(function() {
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

async function addExtraData(dataSource, retrieveDataComponents) {
    await identitiesService.addCreatedByAndModifiedByIdentities(dataSource);
    if (retrieveDataComponents) {
        await addDataComponents(dataSource);
    }
}

async function addExtraDataToAll(dataSources, retrieveDataComponents) {
    for (const dataSource of dataSources) {
        // eslint-disable-next-line no-await-in-loop
        await addExtraData(dataSource, retrieveDataComponents);
    }
}

async function addDataComponents(dataSource) {
    // We have to work with the latest version of all data components to avoid mishandling a situation
    // where an earlier version of a data component may reference a data source, but the latest
    // version doesn't.

    // Retrieve the latest version of all data components
    const allDataComponents = await dataComponentsService.retrieveAllAsync({ });

    // Add the data components that reference the data source
    dataSource.dataComponents = allDataComponents.filter(dataComponent => dataComponent.stix.x_mitre_data_source_ref === dataSource.stix.id);
}

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all data sources with the stixId
    // versions=latest Retrieve the data sources with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        DataSource.find({'stix.id': stixId})
            .lean()
            .exec(function (err, dataSources) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    } else {
                        return callback(err);
                    }
                } else {
                    addExtraDataToAll(dataSources, options.retrieveDataComponents)
                        .then(() => callback(null, dataSources));
                }
            });
    }
    else if (options.versions === 'latest') {
        DataSource.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, dataSource) {
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
                    if (dataSource) {
                        addExtraData(dataSource, options.retrieveDataComponents)
                            .then(() => callback(null, [ dataSource ]));
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

exports.retrieveVersionById = function(stixId, modified, options, callback) {
    // Retrieve the versions of the data source with the matching stixId and modified date

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

    DataSource.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function(err, dataSource) {
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
            if (dataSource) {
                addExtraData(dataSource, options.retrieveDataComponents)
                    .then(() => callback(null, dataSource));
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
    const dataSource = new DataSource(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        dataSource.stix.x_mitre_attack_spec_version = dataSource.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            dataSource.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(dataSource);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (dataSource.stix.id) {
            existingObject = await DataSource.findOne({ 'stix.id': dataSource.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            dataSource.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            dataSource.stix.id = dataSource.stix.id || `x-mitre-data-source--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            dataSource.stix.created_by_ref = organizationIdentityRef;
            dataSource.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedDataSource = await dataSource.save();
        return savedDataSource;
    }
    catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
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

    DataSource.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
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
                    if (err.name === 'MongoError' && err.code === 11000) {
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

exports.delete = function (stixId, stixModified, callback) {
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

    DataSource.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, dataSource) {
        if (err) {
            return callback(err);
        } else {
            // Note: data source is null if not found
            return callback(null, dataSource);
        }
    });
};
