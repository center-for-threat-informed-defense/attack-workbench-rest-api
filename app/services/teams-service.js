'use strict';

const uuid = require('uuid');
const Team = require('../models/team-model');
const regexValidator = require('../lib/regex');
const UserAccount = require('../models/user-account-model');
const {addEffectiveRole,userAccountAsIdentity} = require('./user-accounts-service');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter',
    duplicateName: 'Duplicate name',
};
exports.errors = errors;

exports.retrieveAll = function(options, callback) {
    // Build the aggregation
    const aggregation = [
        { $sort: { 'name': 1 } },
    ];

    if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = { $match: { $or: [
                    { 'name': { '$regex': options.search, '$options': 'i' }},
                    { 'description': { '$regex': options.search, '$options': 'i' }},
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
    Team.aggregate(aggregation, function(err, results) {
        if (err) {
            return callback(err);
        }
        else {
            const teams = results[0].documents;
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
                    data: teams
                };
                return callback(null, returnValue);
            } else {
                return callback(null, teams);
            }
        }
    });
};

exports.retrieveById = function(teamId, callback) {
    if (!teamId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'teamId';
        return callback(error);
    }

    Team.findOne({ 'id': teamId })
        .lean()
        .exec(function (err, team) {
            if (err) {
                if (err.name === 'CastError') {
                    const error = new Error(errors.badlyFormattedParameter);
                    error.parameterName = 'teamId';
                    return callback(error);
                } else {
                    return callback(err);
                }
            } else {
                return callback(null, team);
            }
        });
};

exports.createIsAsync = true;
exports.create = async function(data) {
    // Create the document
    const team = new Team(data);

    // Create a unique id for this user
    // This should usually be undefined. It will only be defined when migrating user accounts from another system.
    if (!team.id) {
      team.id = `team--${uuid.v4()}`;
    }

    // Add a timestamp recording when the user account was first created
    // This should usually be undefined. It will only be defined when migrating user accounts from another system.
    if (!team.created) {
      team.created = new Date().toISOString();
    }

    // Add a timestamp recording when the user account was last modified
    if (!team.modified) {
      team.modified = team.created;
    }

    // Save the document in the database
    try {
        return await team.save();
    }
    catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            // 11000 = Duplicate index
            const error = err.message.contains('name_') ? new Error(errors.duplicateName) :new Error(errors.duplicateId);
            throw error;
        }
        else {
            throw err;
        }
    }
};

exports.updateFull = function(teamId, data, callback) {
    if (!teamId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'teamId';
        return callback(error);
    }

    Team.findOne({ 'id': teamId }, function(err, document) {
        if (err) {
            if (err.name === 'CastError') {
                var error = new Error(errors.badlyFormattedParameter);
                error.parameterName = 'teamId';
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
            // Copy data to found document
            document.name = data.name;
            document.description = data.description;
            document.userIDs = data.userIDs;

            // Set the modified timestamp
            document.modified = new Date().toISOString();

            // And save
            document.save(function(err, savedDocument) {
                if (err) {
                    if (err.name === 'MongoServerError' && err.code === 11000) {
                        // 11000 = Duplicate index
                        const error = err.message.contains('name_') ? new Error(errors.duplicateName) :new Error(errors.duplicateId);
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

exports.delete = function (teamId, callback) {
    if (!teamId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'teamId';
        return callback(error);
    }

    Team.findOneAndRemove({ 'id': teamId }, function (err, team) {
        if (err) {
            return callback(err);
        } else {
            //Note: userAccount is null if not found
            return callback(null, team);
        }
    });
};

exports.retrieveAllUsers = function(teamId, options, callback) {
  if (!teamId) {
      const error = new Error(errors.missingParameter);
      error.parameterName = 'teamId';
      return callback(error);
  }
  Team.findOne({ 'id': teamId })
      .lean()
      .exec(function (err, team) {
          if (err) {
              if (err.name === 'CastError') {
                  const error = new Error(errors.badlyFormattedParameter);
                  error.parameterName = 'teamId';
                  return callback(error);
              } else {
                  return callback(err);
              }
          } else {
              const matchQuery = {'id': {$in: team.userIDs}};
              const aggregation = [
                { $sort: { 'username': 1 } },
                { $match: matchQuery }
              ];
              if (typeof options.search !== 'undefined') {
                options.search = regexValidator.sanitizeRegex(options.search);
                const match = { $match: { $or: [
                            { 'username': { '$regex': options.search, '$options': 'i' }},
                            { 'email': { '$regex': options.search, '$options': 'i' }},
                            { 'displayName': { '$regex': options.search, '$options': 'i' }}
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
              UserAccount.aggregate(aggregation, function(err, results) {
                if (err) {
                    return callback(err);
                }
                else {
                    const userAccounts = results[0].documents;
                    userAccounts.forEach(userAccount => {
                        addEffectiveRole(userAccount);
                        if (options.includeStixIdentity) {
                            userAccount.identity = userAccountAsIdentity(userAccount);
                        }
                    });
        
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
                            data: userAccounts
                        };
                        return callback(null, returnValue);
                    } else {
                        return callback(null, userAccounts);
                    }
                }
            });
          }
      });
};