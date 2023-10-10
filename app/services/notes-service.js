'use strict';

const uuid = require('uuid');
const Note = require('../models/note-model');
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

const NoteRepository = require('../repository/note-repository');

const BaseService = require('./_base.service');

class NoteService extends BaseService {

    constructor() {
        super(NoteRepository, Matrix);
    }

    //  async create(data, options) {
    //     // This function handles two use cases:
    //     //   1. This is a completely new object. Create a new object and generate the stix.id if not already
    //     //      provided. Set both stix.created_by_ref and stix.x_mitre_modified_by_ref to the organization identity.
    //     //   2. This is a new version of an existing object. Create a new object with the specified id.
    //     //      Set stix.x_mitre_modified_by_ref to the organization identity.

    //     // Create the document
    //     const note = new Note(data);

    //     options = options || {};
    //     if (!options.import) {
    //         // Set the ATT&CK Spec Version
    //         note.stix.x_mitre_attack_spec_version = note.stix.x_mitre_attack_spec_version ?? config.app.attackSpecVersion;

    //         // Record the user account that created the object
    //         if (options.userAccountId) {
    //             note.workspace.workflow.created_by_user_account = options.userAccountId;
    //         }

    //         // Set the default marking definitions
    //         await attackObjectsService.setDefaultMarkingDefinitions(note);

    //         // Get the organization identity
    //         const organizationIdentityRef = await systemConfigurationService.retrieveOrganizationIdentityRef();

    //         // Check for an existing object
    //         let existingObject;
    //         if (note.stix.id) {
    //             existingObject = await Note.findOne({ 'stix.id': note.stix.id });
    //         }

    //         if (existingObject) {
    //             // New version of an existing object
    //             // Only set the x_mitre_modified_by_ref property
    //             note.stix.x_mitre_modified_by_ref = organizationIdentityRef;
    //         }
    //         else {
    //             // New object
    //             // Assign a new STIX id if not already provided
    //             note.stix.id = note.stix.id || `note--${uuid.v4()}`;

    //             // Set the created_by_ref and x_mitre_modified_by_ref properties
    //             note.stix.created_by_ref = organizationIdentityRef;
    //             note.stix.x_mitre_modified_by_ref = organizationIdentityRef;
    //         }
    //     }

    //     // Save the document in the database
    //     try {
    //         const savedNote = await note.save();
    //         return savedNote;
    //     }
    //     catch(err) {
    //         if (err.name === 'MongoServerError' && err.code === 11000) {
    //             // 11000 = Duplicate index
    //             const error = new Error(errors.duplicateId);
    //             throw error;
    //         }
    //         else {
    //             throw err;
    //         }
    //     }
    // };

    exports.updateVersion = function(stixId, stixModified, data, callback) {
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

    Note.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
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

}

module.exports = new NoteService();