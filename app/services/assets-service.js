'use strict';

const uuid = require('uuid');

const Asset = require('../models/asset-model');

const attackObjectsService = require('./attack-objects-service');
const identitiesService = require('./identities-service');
const systemConfigurationService = require('./system-configuration-service');

const config = require('../config/config');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

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
    if (typeof options.lastUpdatedBy !== 'undefined') {
        query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
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
        options.search = regexValidator.sanitizeRegex(options.search);
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
    const results = await Asset.aggregate(aggregation);

    await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(results[0].documents);

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
        return returnValue;
    }
    else {
        return results[0].documents;
    }
};

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all assets with the stixId
    // versions=latest Retrieve the asset with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Asset.find({'stix.id': stixId})
            .sort('-stix.modified')
            .lean()
            .exec(function (err, assets) {
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
                    identitiesService.addCreatedByAndModifiedByIdentitiesToAll(assets)
                        .then(() => callback(null, assets));
                }
            });
    }
    else if (options.versions === 'latest') {
        Asset.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, asset) {
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
                    if (asset) {
                        identitiesService.addCreatedByAndModifiedByIdentities(asset)
                            .then(() => callback(null, [ asset ]));
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

exports.retrieveByIdAsync = async function(stixId, options) {
    // versions=all    Retrieve all versions of the asset with the stixId
    // versions=latest Retrieve the asset with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        throw error;
    }

    if (options.versions === 'all') {
        try {
            const assets = await Asset.find({'stix.id': stixId}).lean();
            return assets;
        }
        catch(err) {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                throw error;
            } else {
                throw err;
            }
        }
    }
    else if (options.versions === 'latest') {
        try {
            const asset = await Asset.findOne({'stix.id': stixId})
                .sort('-stix.modified')
                .lean();
            if (asset) {
                await identitiesService.addCreatedByAndModifiedByIdentities(asset);
                return [ asset ];
            }
            else {
                return [];
            }
        }
        catch(err) {
            if (err.name === 'CastError') {
                const error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'stixId';
                throw error;
            }
            else {
                throw err;
            }
        }
    }
    else {
        const error = new Error(errors.invalidQueryStringParameter);
        error.parameterName = 'versions';
        throw error;
    }
};

exports.retrieveVersionById = async function(stixId, modified, options) {
    // Retrieve the version of the asset with the matching stixId and modified date

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        throw error;
    }

    if (!modified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        throw error;
    }

    try {
        const asset = await Asset.findOne({ 'stix.id': stixId, 'stix.modified': modified });
        return asset;
    }
    catch(err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'stixId';
            throw error;
        }
        else {
            throw err;
        }

    }
};

exports.createIsAsync = true;
exports.create = async function(data, options) {
    // This function handles two use cases:
    //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //   2. This is a new version of an existing object. Create a new object with the specified id.
    //      Set stix.x_mitre_modified_by_ref to the organization identity.

    // Create the document
    const asset = new Asset(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        asset.stix.x_mitre_attack_spec_version = asset.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            asset.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(asset);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (asset.stix.id) {
            existingObject = await Asset.findOne({ 'stix.id': asset.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            asset.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            asset.stix.id = asset.stix.id || `x-mitre-asset--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            asset.stix.created_by_ref = organizationIdentityRef;
            asset.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedAsset = await asset.save();
        return savedAsset;
    }
    catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            throw new Error(errors.duplicateId);
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = async function(stixId, stixModified, data) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        throw error;
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        throw error;
    }

    try {
        const asset = await Asset.findOne({'stix.id': stixId, 'stix.modified': stixModified});
        if (!asset) {
            // asset not found
            return null;
        }
        else {
            // Copy data to found document and save
            Object.assign(asset, data);
            const savedAsset = await asset.save();
            return savedAsset;
        }
    }
    catch(err) {
        if (err.name === 'CastError') {
            const error = new Error(errors.badlyFormattedParameter);
            error.parameterName = 'stixId';
            throw error;
        }
        else if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            throw new Error(errors.duplicateId);
        }
        else {
            throw err;
        }
    }
};

exports.deleteById = async function (stixId) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        throw error;
    }

    const assets = await Asset.deleteMany({ 'stix.id': stixId });
    return assets;
};

exports.deleteVersionById = async function (stixId, stixModified) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        throw error;
    }

    if (!stixModified) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'modified';
        throw error;
    }

    const asset = await Asset.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified });
    return asset;
};
