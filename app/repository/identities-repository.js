'use strict';

const BaseRepository = require('./_base.repository');
const Identity = require('../models/identity-model');
const { DatabaseError } = require('../exceptions');

class IdentitiesRepository extends BaseRepository {
  async retrieveManyByStixIds(stixIds) {
    try {
      if (!stixIds || stixIds.length === 0) {
        return [];
      }

      // Get all versions of these identities
      const identities = await this.model
        .find({ 'stix.id': { $in: stixIds } })
        .lean()
        .exec();

      // Group by stix.id and keep only the latest version of each
      const latestVersionsMap = new Map();

      identities.forEach((identity) => {
        const existing = latestVersionsMap.get(identity.stix.id);
        if (!existing || identity.stix.modified > existing.stix.modified) {
          latestVersionsMap.set(identity.stix.id, identity);
        }
      });

      return Array.from(latestVersionsMap.values());
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new IdentitiesRepository(Identity);
