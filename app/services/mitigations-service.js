'use strict';

const uuid = require('uuid');
const Mitigation = require('../models/mitigation-model');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

exports.retrieveAll = function(callback) {
    Mitigation.find(function(err, mitigations) {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, mitigations);
        }
    });
};

exports.retrieveById = function(stixId, versions, callback) {
    // versions=all Retrieve all mitigations with the stixId
    // versions=latest Retrieve the mitigations with the latest modified date for this stixId

    if (!stixId) {
        const error = new Error(errors.missingParameter);
        error.parameterName = 'stixId';
        return callback(error);
    }

    if (versions === 'all') {
        Mitigation.find({'stix.id': stixId})
            .lean()
            .exec(function (err, mitigations) {
                if (err) {
                    if (err.name === 'CastError') {
                        const error = new Error(errors.badlyFormattedParameter);
                        error.parameterName = 'stixId';
                        return callback(error);
                    } else {
                        return callback(err);
                    }
                } else {
                    return callback(null, mitigations);
                }
            });
    }
    else if (versions === 'latest') {
        Mitigation.findOne({ 'stix.id': stixId })
            .sort('-stix.modified')
            .lean()
            .exec(function(err, mitigation) {
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
                    if (mitigation) {
                        return callback(null, [ mitigation ]);
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
    // Retrieve the versions of the mitigation with the matching stixId and modified date

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

    Mitigation.findOne({ 'stix.id': stixId, 'stix.modified': modified }, function(err, mitigation) {
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
            if (mitigation) {
                return callback(null, mitigation);
            }
            else {
                console.log('** NOT FOUND')
                return callback();
            }
        }
    });
};

exports.create = function(data, callback) {
    // This function handles two use cases:
    //   1. stix.id is undefined. Create a new object and generate the stix.id
    //   2. stix.id is defined. Create a new object with the specified id. This is
    //      a new version of an existing object.
    //      TODO: Verify that the object already exists (?)

    // Create the document
    const mitigation = new Mitigation(data);

    if (!mitigation.stix.id) {
        // Assign a new STIX id
        mitigation.stix.id = `course-of-action--${uuid.v4()}`;
    }

    // Save the document in the database
    mitigation.save(function(err, savedMitigation) {
        if (err) {
            if (err.name === 'MongoError' && err.code === 11000) {
                // 11000 = Duplicate index
                const error = new Error(errors.duplicateId);
                return callback(error);
            }
            else {
                return callback(err);
            }
        }
        else {
            return callback(null, savedMitigation);
        }
    });
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

    Mitigation.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
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

    Mitigation.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': stixModified }, function (err, mitigation) {
        if (err) {
            return callback(err);
        } else {
            //Note: mitigation is null if not found
            return callback(null, mitigation);
        }
    });
};
