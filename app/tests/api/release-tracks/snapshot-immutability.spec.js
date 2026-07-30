'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

describe('Release-track snapshot immutability contract', function () {
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

  it('does not expose direct snapshot metadata or member-replacement routes', async function () {
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Removed snapshot mutation routes', type: 'standard' },
      201,
    );
    const modified = encodeURIComponent(track.modified);

    await api('post', `/api/release-tracks/${track.id}/contents`, {}, 404);
    await api('post', `/api/release-tracks/${track.id}/snapshots/${modified}/meta`, {}, 404);
    await api('post', `/api/release-tracks/${track.id}/snapshots/${modified}/contents`, {}, 404);
  });

  it('deletes only the latest untagged draft', async function () {
    const initial = await post(
      '/api/release-tracks/new',
      { name: 'Latest draft deletion boundary', type: 'standard' },
      201,
    );
    const middle = await post(`/api/release-tracks/${initial.id}/meta`, {
      description: 'Middle draft',
    });
    const latest = await post(`/api/release-tracks/${initial.id}/meta`, {
      description: 'Latest draft',
    });

    const historicalDelete = await api(
      'delete',
      `/api/release-tracks/${initial.id}/snapshots/${encodeURIComponent(initial.modified)}`,
      undefined,
      409,
    );
    expect(historicalDelete.body).toEqual({
      message: 'Only the latest untagged snapshot can be deleted',
      snapshot_modified: initial.modified,
      latest_snapshot_modified: latest.modified,
    });

    await api(
      'delete',
      `/api/release-tracks/${initial.id}/snapshots/${encodeURIComponent(latest.modified)}`,
      undefined,
      204,
    );
    const reverted = await api(
      'get',
      `/api/release-tracks/${initial.id}/snapshots/latest`,
      undefined,
      200,
    );
    expect(reverted.body.modified).toBe(middle.modified);

    await post(`/api/release-tracks/${initial.id}/snapshots/latest/release`, {
      version: '1.0',
    });
    const taggedDelete = await api(
      'delete',
      `/api/release-tracks/${initial.id}/snapshots/${encodeURIComponent(middle.modified)}`,
      undefined,
      409,
    );
    expect(taggedDelete.text).toContain('Tagged snapshot version 1.0 cannot be deleted');
  });
});
