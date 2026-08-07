'use strict';

const notesRepository = require('../../repository/notes-repository');
const { BaseService } = require('../meta-classes');
const { Note: NoteType } = require('../../lib/types');

const { BadlyFormattedParameterError } = require('../../exceptions');

class NotesService extends BaseService {
  async updateVersion(stixId, stixModified, data, options) {
    return this.updateFull(stixId, stixModified, data, options);
  }

  /**
   * Adds relevant notes to the bundle
   * @param {Array<Object>} bundleObjects - Objects in the bundle
   */
  async addNotes(bundleObjects) {
    if (!Array.isArray(bundleObjects)) {
      throw new BadlyFormattedParameterError({
        parameterName: 'bundleObjects',
        details: 'Bundle objects must be an array',
      });
    }

    // Get all active notes from repository
    const allNotes = await this.repository.retrieveAllActiveNotes();

    // Map bundle objects for reference checking
    const bundleObjectMap = new Map(bundleObjects.map((obj) => [obj.id, obj]));

    // Find notes referencing bundle objects
    const notesToAdd = allNotes.filter(
      (note) =>
        Array.isArray(note?.stix?.object_refs) &&
        note.stix.object_refs.some((ref) => bundleObjectMap.has(ref)) &&
        !bundleObjectMap.has(note.stix.id),
    );

    // Add filtered notes to bundle
    bundleObjects.push(...notesToAdd.map((note) => note.stix));

    return bundleObjects;
  }
}

module.exports = new NotesService(NoteType, notesRepository);
