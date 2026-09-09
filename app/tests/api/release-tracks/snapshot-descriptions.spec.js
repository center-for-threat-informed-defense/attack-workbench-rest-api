'use strict';

const crypto = require('node:crypto');
const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

describe('Release-track snapshot descriptions', function () {
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

  after(async function () {
    await database.closeConnection();
  });

  function api(method, path, body, status) {
    const call = request(app)
      [method](path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
    if (body !== undefined) call.send(body);
    return call.expect(status);
  }

  async function post(path, body, status = 200) {
    return (await api('post', path, body, status)).body;
  }

  async function put(path, body, status = 200) {
    return (await api('put', path, body, status)).body;
  }

  async function get(path, status = 200) {
    return (await api('get', path, undefined, status)).body;
  }

  async function createTrack(name, extra = {}) {
    return post('/api/release-tracks/new', { name, type: 'standard', ...extra }, 201);
  }

  function descriptionPath(track) {
    return `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(track.modified)}/description`;
  }

  it('sets, trims, lists, and clears a draft snapshot description without changing track metadata', async function () {
    const track = await createTrack('Snapshot Description Draft', {
      description: 'Long-lived track purpose',
      snapshot_description: '  Initial analyst context.  ',
    });

    expect(track.snapshot_description).toBe('Initial analyst context.');

    const updated = await put(descriptionPath(track), {
      description: '  Analyst context for this draft.  ',
    });

    expect(updated).toMatchObject({
      id: track.id,
      modified: track.modified,
      version: null,
      description: 'Long-lived track purpose',
      snapshot_description: 'Analyst context for this draft.',
    });

    const history = await get(`/api/release-tracks/${track.id}/snapshots`);
    expect(history.data[0]).toMatchObject({
      modified: track.modified,
      description: 'Long-lived track purpose',
      snapshot_description: 'Analyst context for this draft.',
    });

    const cleared = await put(descriptionPath(track), { description: '   ' });
    expect(cleared).not.toHaveProperty('snapshot_description');
    const unchanged = await get(`/api/release-tracks/${track.id}/snapshots/latest`);
    expect(unchanged.description).toBe('Long-lived track purpose');
    expect(unchanged.modified).toBe(track.modified);
  });

  it('sets release notes while tagging and rejects later edits on the released snapshot', async function () {
    const track = await createTrack('Snapshot Description Release', {
      description: 'Stable track description',
    });
    const released = await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, {
      version: '1.0',
      description: 'What changed in the first publication.',
    });

    expect(released).toMatchObject({
      version: '1.0',
      description: 'Stable track description',
      snapshot_description: 'What changed in the first publication.',
    });
    expect(released.modified).not.toBe(track.modified);
    expect(new Date(released.release_source_modified).toISOString()).toBe(
      new Date(track.modified).toISOString(),
    );
    const originalHashes = released.bundle_hashes;

    const conflict = await put(
      descriptionPath(released),
      { description: 'Corrected internal release context.' },
      409,
    );
    expect(conflict.message).toBe('Snapshot notes are immutable once the snapshot is released.');

    const unchangedSnapshot = await get(
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(released.modified)}`,
    );
    expect(unchangedSnapshot.snapshot_description).toBe('What changed in the first publication.');
    expect(unchangedSnapshot.bundle_hashes).toEqual(originalHashes);

    for (const stixVersion of ['2.0', '2.1']) {
      const bundle = await get(
        `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
          released.modified,
        )}?format=bundle&stixVersion=${stixVersion}`,
      );
      const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(bundle, null, 4), 'utf8')
        .digest('hex');
      expect(hash).toBe(originalHashes[`stix_2_${stixVersion.split('.')[1]}`]);
      const collection = bundle.objects.find((object) => object.type === 'x-mitre-collection');
      if (stixVersion === '2.0') {
        expect(collection).toBeUndefined();
      } else {
        expect(collection.description).toBe('What changed in the first publication.');
      }
    }

    const registry = await get('/api/release-tracks');
    const registryTrack = registry.data.find((entry) => entry.track_id === track.id);
    expect(registryTrack.description).toBe('Stable track description');
  });

  it('clears existing draft notes when release explicitly supplies an empty description', async function () {
    const track = await createTrack('Snapshot Description Release Clear', {
      snapshot_description: 'Temporary draft context',
    });

    const released = await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, {
      version: '1.0',
      description: '   ',
    });

    expect(released).not.toHaveProperty('snapshot_description');
  });

  it('preserves notes within a rolling draft and clears them for the next release cycle', async function () {
    const initial = await createTrack('Snapshot Description Lifecycle');
    await put(descriptionPath(initial), { description: 'Notes for release 1.0' });

    const rollingDraft = await post(`/api/release-tracks/${initial.id}/meta`, {
      name: 'Snapshot Description Lifecycle Updated',
    });
    expect(rollingDraft.snapshot_description).toBe('Notes for release 1.0');

    const released = await post(`/api/release-tracks/${initial.id}/snapshots/latest/release`, {
      version: '1.0',
    });
    expect(released.snapshot_description).toBe('Notes for release 1.0');

    const nextDraft = await post(`/api/release-tracks/${initial.id}/meta`, {
      name: 'Snapshot Description Lifecycle Next',
    });
    expect(nextDraft.version).toBeNull();
    expect(nextDraft).not.toHaveProperty('snapshot_description');
  });

  it('stores virtual materialization descriptions as snapshot notes rather than track descriptions', async function () {
    const component = await createTrack('Snapshot Description Component');
    await post(`/api/release-tracks/${component.id}/snapshots/latest/release`, {
      version: '1.0',
    });
    const virtual = await post(
      '/api/release-tracks/new',
      {
        name: 'Snapshot Description Virtual',
        description: 'Stable virtual track purpose',
        type: 'virtual',
        composition: {
          component_tracks: [
            {
              track_id: component.id,
              resolution_strategy: 'latest_tagged',
              priority: 1,
            },
          ],
          deduplication: { strategy: 'prioritize_latest_object' },
        },
      },
      201,
    );

    const materialized = await post(
      `/api/release-tracks/${virtual.id}/virtual/snapshots/create`,
      { description: 'Q1 composition review and conflict decisions.' },
      201,
    );
    expect(materialized.description).toBe('Stable virtual track purpose');
    expect(materialized.snapshot_description).toBe('Q1 composition review and conflict decisions.');
  });

  it('rejects malformed and oversized snapshot descriptions', async function () {
    const track = await createTrack('Snapshot Description Validation');
    await api(
      'post',
      '/api/release-tracks/new',
      {
        name: 'Snapshot Description Creation Validation',
        type: 'standard',
        snapshot_description: 'x'.repeat(4001),
      },
      400,
    );
    await api('put', descriptionPath(track), { description: 'x'.repeat(4001) }, 400);
    await api('put', descriptionPath(track), { description: 'valid', extra: true }, 400);
    await api(
      'post',
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      { version: '1.0', description: 'x'.repeat(4001) },
      400,
    );
  });

  it('returns not found when the selected snapshot does not exist', async function () {
    const track = await createTrack('Snapshot Description Missing');
    await api(
      'put',
      `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
        '2000-01-01T00:00:00.000Z',
      )}/description`,
      { description: 'Missing' },
      404,
    );
  });
});
