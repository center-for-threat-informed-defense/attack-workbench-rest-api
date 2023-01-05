'use strict';

const notesService = require('../services/notes-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        state: req.query.state,
        includeRevoked: req.query.includeRevoked,
        includeDeprecated: req.query.includeDeprecated,
        search: req.query.search,
        includePagination: req.query.includePagination
    }

    notesService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get notes. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total note(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } note(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    const options = {
        versions: req.query.versions || 'latest'
    }

    notesService.retrieveById(req.params.stixId, options, function (err, notes) {
        if (err) {
            if (err.message === notesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else if (err.message === notesService.errors.invalidQueryStringParameter) {
                logger.warn('Invalid query string: versions=' + req.query.versions);
                return res.status(400).send('Query string parameter versions is invalid.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get notes. Server error.');
            }
        }
        else {
            if (notes.length === 0) {
                return res.status(404).send('Note not found.');
            }
            else {
                logger.debug(`Success: Retrieved ${ notes.length } note(s) with id ${ req.params.stixId }`);
                return res.status(200).send(notes);
            }
        }
    });
};

exports.retrieveVersionById = function(req, res) {
    notesService.retrieveVersionById(req.params.stixId, req.params.modified, function (err, note) {
        if (err) {
            if (err.message === notesService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted stix id: ' + req.params.stixId);
                return res.status(400).send('Stix id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get note. Server error.');
            }
        }
        else {
            if (!note) {
                return res.status(404).send('Note not found.');
            }
            else {
                logger.debug(`Success: Retrieved note with id ${ note.id }`);
                return res.status(200).send(note);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const noteData = req.body;

    // Create the note
    try {
        const options = {
            import: false,
            userAccountId: req.user?.userAccountId
        };
        const note = await notesService.create(noteData, options);
        logger.debug("Success: Created note with id " + note.stix.id);
        return res.status(201).send(note);
    }
    catch(err) {
        if (err.message === notesService.errors.duplicateId) {
            logger.warn("Duplicate stix.id and stix.modified");
            return res.status(409).send('Unable to create note. Duplicate stix.id and stix.modified properties.');
        }
        else {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to create note. Server error.");
        }
    }
};

exports.updateVersion = function(req, res) {
    // Get the data from the request
    const noteData = req.body;

    // Create the note
    notesService.updateVersion(req.params.stixId, req.params.modified, noteData, function(err, note) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update note. Server error.");
        }
        else {
            if (!note) {
                return res.status(404).send('Note not found.');
            }
            else {
                logger.debug("Success: Updated note with id " + note.stix.id);
                return res.status(200).send(note);
            }
        }
    });
};

exports.deleteById = function(req, res) {
    notesService.deleteById(req.params.stixId, function (err, results) {
        if (err) {
            logger.error('Delete note failed. ' + err);
            return res.status(500).send('Unable to delete note. Server error.');
        }
        else {
            if (results.deletedCount === 0) {
                return res.status(404).send('Note not found.');
            }
            else {
                logger.debug(`Success: Deleted note with id ${ req.params.stixId }`);
                return res.status(204).end();
            }
        }
    });
};

exports.deleteVersionById = function(req, res) {
    notesService.deleteVersionById(req.params.stixId, req.params.modified, function (err, note) {
        if (err) {
            logger.error('Delete note version failed. ' + err);
            return res.status(500).send('Unable to delete note. Server error.');
        }
        else {
            if (!note) {
                return res.status(404).send('Note not found.');
            } else {
                logger.debug(`Success: Deleted note with id ${ note.stix.id} and modified ${ note.stix.modified }`);
                return res.status(204).end();
            }
        }
    });
};
