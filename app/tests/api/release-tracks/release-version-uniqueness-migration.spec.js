'use strict';

const { expect } = require('expect');
const mongoose = require('mongoose');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const releaseTracksService = require('../../../services/release-tracks/release-tracks-service');
const migration = require('../../../../migrations/20260730040000-enforce-release-track-version-uniqueness');

const UNIQUE_INDEX = 'unique_tagged_version';
const LEGACY_INDEX = 'id_1_version_1';

describe('Release-track tagged-version uniqueness migration', function () {
  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
  });

  after(async function () {
    await database.closeConnection();
  });

  it('fails closed on legacy duplicates before replacing indexes and is rerunnable after repair', async function () {
    const track = await releaseTracksService.createTrack({
      name: 'Legacy Duplicate Release Versions',
      type: 'standard',
    });
    const released = await releaseTracksService.releaseLatest(track.id, {
      version: '1.0',
      userAccountId: 'migration-test',
    });
    const collection = mongoose.connection.db.collection(track.id);

    await collection.dropIndex(UNIQUE_INDEX);
    await collection.createIndex({ id: 1, version: 1 }, { name: LEGACY_INDEX });

    const duplicate = { ...released };
    delete duplicate._id;
    duplicate.modified = new Date(new Date(released.modified).getTime() + 1000);
    await collection.insertOne(duplicate);
    await mongoose.connection.db
      .collection('releaseTrackRegistry')
      .deleteOne({ track_id: track.id });

    await expect(migration.up(mongoose.connection.db)).rejects.toMatchObject({
      message: expect.stringContaining(`${track.id} version 1.0 (2 snapshots)`),
      duplicates: [
        expect.objectContaining({
          track_id: track.id,
          version: '1.0',
        }),
      ],
    });

    let indexes = await collection.indexes();
    expect(indexes.some((index) => index.name === LEGACY_INDEX)).toBe(true);
    expect(indexes.some((index) => index.name === UNIQUE_INDEX)).toBe(false);

    await collection.deleteOne({ modified: duplicate.modified });
    await migration.up(mongoose.connection.db);
    await migration.up(mongoose.connection.db);

    indexes = await collection.indexes();
    expect(indexes.some((index) => index.name === LEGACY_INDEX)).toBe(false);
    expect(indexes.find((index) => index.name === UNIQUE_INDEX)).toMatchObject({
      key: { id: 1, version: 1 },
      unique: true,
      partialFilterExpression: { version: { $type: 'string' } },
    });
  });
});
