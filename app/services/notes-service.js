'use strict';

const Note = require('../models/note-model');

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
const { BadlyFormattedParameterError, DuplicateIdError, MissingParameterError } = require('../exceptions');

class NoteService extends BaseService {

    constructor() {
        super(NoteRepository, Note);
    }

    async updateVersion(stixId, stixModified, data) {
        if (!stixId) {
            throw new MissingParameterError;
        }

        if (!stixModified) {
            throw new MissingParameterError;
        }

        Note.findOne({ 'stix.id': stixId, 'stix.modified': stixModified }, function(err, document) {
            if (err) {
                if (err.name === 'CastError') {
                    throw new BadlyFormattedParameterError;
                }
                else {
                    throw err;
                }
            }
            else if (!document) {
                // document not found
                return null;
            }
            else {
                // Copy data to found document and save
                Object.assign(document, data);
                document.save(function(err, savedDocument) {
                    if (err) {
                        if (err.name === 'MongoServerError' && err.code === 11000) {
                            throw new DuplicateIdError;
                        }
                        else {
                            throw err;
                        }
                    }
                    else {
                        return savedDocument;
                    }
                });
            }
        });
    };

}

module.exports = new NoteService();