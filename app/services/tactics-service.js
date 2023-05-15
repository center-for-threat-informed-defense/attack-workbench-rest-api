'use strict';

const uuid = require('uuid');
const util = require('util');

const Tactic = require('../models/tactic-model');
const systemConfigurationService = require('./system-configuration-service');
const identitiesService = require('./identities-service');
const attackObjectsService = require('./attack-objects-service');
const config = require('../config/config');
const regexValidator = require('../lib/regex');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

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
    if (typeof options.domain !== 'undefined') {
        if (Array.isArray(options.domain)) {
            query['stix.x_mitre_domains'] = { $in: options.domain };
        }
        else {
            query['stix.x_mitre_domains'] = options.domain;
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
    Tactic.aggregate(aggregation, function(err, results) {
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

exports.retrieveById = function(stixId, options, callback) {
    // versions=all Retrieve all tactics with the stixId
    // versions=latest Retrieve the tactics with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (options.versions === 'all') {
        Tactic.find({'stix.id': stixId})
            .lean()
            .exec(function (err, tactics) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    } else {
                        return callback(err);
                    }
                } else {
                    identitiesService.addCreatedByAndModifiedByIdentitiesToAll(tactics)
                        .then(() => callback(null, tactics));
                }
            });
    }
    else if (options.versions === 'latest') {
        Tactic.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, tactic) {
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
                    if (tactic) {
                        identitiesService.addCreatedByAndModifiedByIdentities(tactic)
                            .then(() => callback(null, [ tactic ]));
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
    // Retrieve the versions of the tactic with the matching stixId and modified date

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

    Tactic.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function(err, tactic) {
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
            if (tactic) {
                identitiesService.addCreatedByAndModifiedByIdentities(tactic)
                    .then(() => callback(null, tactic));
            }
            else {
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
    const tactic = new Tactic(data);

    options = options || {};
    if (!options.import) {
        // Set the ATT&CK Spec Version
        tactic.stix.x_mitre_attack_spec_version = tactic.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

        // Record the user account that created the object
        if (options.userAccountId) {
            tactic.workspace.workflow.created_by_user_account = options.userAccountId;
        }

        // Set the default marking definitions
        await attackObjectsService.setDefaultMarkingDefinitions(tactic);

        // Get the organization identity
        const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

        // Check for an existing object
        let existingObject;
        if (tactic.stix.id) {
            existingObject = await Tactic.findOne({ 'stix.id': tactic.stix.id });
        }

        if (existingObject) {
            // New version of an existing object
            // Only set the x_mitre_modified_by_ref property
            tactic.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
        else {
            // New object
            // Assign a new STIX id if not already provided
            tactic.stix.id = tactic.stix.id || `x-mitre-tactic--${uuid.v4()}`;

            // Set the created_by_ref and x_mitre_modified_by_ref properties
            tactic.stix.created_by_ref = organizationIdentityRef;
            tactic.stix.x_mitre_modified_by_ref = organizationIdentityRef;
        }
    }

    // Save the document in the database
    try {
        const savedTactic = await tactic.save();
        return savedTactic;
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

    Tactic.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
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

    Tactic.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, tactic) {
        if (err) {
            return callback(err);
        } else {
            //Note: tactic is null if not found
            return callback(null, tactic);
        }
    });
};

exports.deleteById = function (stixId, callback) {
    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    Tactic.deleteMany({ 'stix.id': stixId }, function (err, tactic) {
        if (err) {
            return callback(err);
        } else {
            //Note: tactic is null if not found
            return callback(null, tactic);
        }
    });
};

function techniqueMatchesTactic(tactic) {
    return function(technique) {
        // A tactic matches if the technique has a kill chain phase such that:
        //   1. The phase's kill_chain_name matches one of the tactic's kill chain names (which are derived from the tactic's x_mitre_domains)
        //   2. The phase's phase_name matches the tactic's x_mitre_shortname

        // Convert the tactic's domain names to kill chain names
        const tacticKillChainNames = tactic.stix.x_mitre_domains.map(domain => config.domainToKillChainMap[domain]);
        return technique.stix.kill_chain_phases.some(phase => phase.phase_name === tactic.stix.x_mitre_shortname && tacticKillChainNames.includes(phase.kill_chain_name));
    }
}

function getPageOfData(data, options) {
    const startPos = options.offset;
    const endPos = (options.limit === 0) ? data.length : Math.min(options.offset + options.limit, data.length);
    return data.slice(startPos, endPos);
}

let retrieveAllTechniques;
exports.retrieveTechniquesForTactic = async function(stixId, modified, options) {
    // Late binding to avoid circular dependency between modules
    if (!retrieveAllTechniques) {
        const techniquesService = require('./techniques-service');
        retrieveAllTechniques = util.promisify(techniquesService.retrieveAll);
    }

    // Retrieve the techniques associated with the tactic (the tactic identified by stixId and modified date)
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
        const tactic = await Tactic.findOne({ 'stix.id': stixId, 'stix.modified': modified });
        // Note: document is null if not found
        if (!tactic) {
            return null;
        }
        else {
            const allTechniques = await retrieveAllTechniques({});
            const filteredTechniques = allTechniques.filter(techniqueMatchesTactic(tactic));
            const pagedResults = getPageOfData(filteredTechniques, options);
            if (options.includePagination) {
                const returnValue = {
                    pagination: {
                        total: pagedResults.length,
                        offset: options.offset,
                        limit: options.limit
                    },
                    data: pagedResults
                };
                return returnValue;
            }
            else {
                return pagedResults;
            }
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
};
