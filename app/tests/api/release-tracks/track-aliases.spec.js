'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const ReleaseTrackRegistry = require('../../../models/release-tracks/release-track-registry-model');

describe('Release-track aliases', function () {
  let app;
  let passportCookie;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  function authenticated(builder) {
    return builder
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  async function post(path, body, status = 201) {
    return (await authenticated(request(app).post(path).send(body)).expect(status)).body;
  }

  async function get(path, status = 200) {
    return (await authenticated(request(app).get(path)).expect(status)).body;
  }

  async function createTrack(name, alias) {
    return post('/api/release-tracks/new', { name, type: 'standard', alias });
  }

  it('creates a track with an alias and resolves it on every :id route', async function () {
    const track = await createTrack('Aliased Track', 'aliased-track');

    const registry = await ReleaseTrackRegistry.findOne({ track_id: track.id }).lean().exec();
    expect(registry.alias).toBe('aliased-track');

    const viaAlias = await get('/api/release-tracks/aliased-track/snapshots/latest');
    const viaId = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    expect(viaAlias.id).toBe(track.id);
    expect(viaAlias.alias).toBe('aliased-track');
    expect(viaAlias.modified).toBe(viaId.modified);

    const snapshots = await get('/api/release-tracks/aliased-track/snapshots');
    expect(snapshots.data[0].id).toBe(track.id);

    const configuration = await get('/api/release-tracks/aliased-track/config');
    expect(configuration).toBeDefined();

    const listed = await get('/api/release-tracks');
    const entry = listed.data.find((candidate) => candidate.track_id === track.id);
    expect(entry.alias).toBe('aliased-track');
  });

  it('sets, changes, and clears an alias through metadata without cloning a snapshot', async function () {
    const track = await createTrack('Renamed Alias Track');
    const before = await get(`/api/release-tracks/${track.id}/snapshots`);
    expect(before.data).toHaveLength(1);

    const set = await post(`/api/release-tracks/${track.id}/meta`, { alias: 'renamed-one' }, 200);
    expect(set.modified).toBe(before.data[0].modified);
    expect((await get('/api/release-tracks/renamed-one/snapshots/latest')).id).toBe(track.id);

    await post('/api/release-tracks/renamed-one/meta', { alias: 'renamed-two' }, 200);
    expect((await get('/api/release-tracks/renamed-two/snapshots/latest')).id).toBe(track.id);
    await get('/api/release-tracks/renamed-one/snapshots/latest', 404);

    const cleared = await post(`/api/release-tracks/${track.id}/meta`, { alias: null }, 200);
    expect(cleared.alias).toBeUndefined();
    expect((await get(`/api/release-tracks/${track.id}/snapshots/latest`)).alias).toBeNull();
    await get('/api/release-tracks/renamed-two/snapshots/latest', 404);

    const after = await get(`/api/release-tracks/${track.id}/snapshots`);
    expect(after.data).toHaveLength(1);

    const registry = await ReleaseTrackRegistry.findOne({ track_id: track.id }).lean().exec();
    expect(registry).not.toHaveProperty('alias');
  });

  it('keeps aliases unique across tracks', async function () {
    const first = await createTrack('Unique Alias A', 'shared-alias');
    const second = await createTrack('Unique Alias B');

    await post(
      '/api/release-tracks/new',
      { name: 'Unique Alias C', type: 'standard', alias: 'shared-alias' },
      409,
    );
    await post(`/api/release-tracks/${second.id}/meta`, { alias: 'shared-alias' }, 409);
    // Re-asserting a track's own alias is not a conflict.
    await post(`/api/release-tracks/${first.id}/meta`, { alias: 'shared-alias' }, 200);
  });

  it('rejects malformed and reserved aliases', async function () {
    for (const alias of [
      'Upper-Case',
      'has space',
      '-leading',
      'trailing-',
      'a',
      'x'.repeat(65),
      'new',
      'new-from-bundle',
      'import',
      'objects',
      'ephemeral',
      'latest',
      'release-track',
      'release-track--1234',
    ]) {
      await post('/api/release-tracks/new', { name: 'Bad Alias', type: 'standard', alias }, 400);
    }
  });

  it('returns 404 for an unknown alias and 400 for a malformed canonical id', async function () {
    await get('/api/release-tracks/no-such-alias/snapshots/latest', 404);
    await get('/api/release-tracks/Not-An-Alias/snapshots/latest', 404);
  });

  it('requires the canonical id as the deletion confirmation when addressed by alias', async function () {
    const track = await createTrack('Delete By Alias', 'delete-by-alias');

    await authenticated(
      request(app).delete('/api/release-tracks/delete-by-alias?confirm_track_id=delete-by-alias'),
    ).expect(400);
    await authenticated(
      request(app).delete(`/api/release-tracks/delete-by-alias?confirm_track_id=${track.id}`),
    ).expect(204);
    await get('/api/release-tracks/delete-by-alias/snapshots/latest', 404);
  });
});
