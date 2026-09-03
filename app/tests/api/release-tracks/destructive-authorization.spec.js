'use strict';

const request = require('supertest');
const { expect } = require('expect');
const sinon = require('sinon');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const UserAccount = require('../../../models/user-account-model');
const ReleaseTrackAuditEvent = require('../../../models/release-tracks/release-track-audit-event-model');
const auditRepository = require('../../../repository/release-tracks/release-track-audit-event.repository');
const systemConfigurationService = require('../../../services/system/system-configuration-service');
const {
  ReleaseTrackContentManifest,
} = require('../../../models/release-tracks/release-track-content-manifest-model');
const { releaseExactMembers } = require('./release-track-test-helpers');

const markingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Release-track destructive authorization and audit', function () {
  let app;
  let passportCookie;
  let anonymousUser;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
    anonymousUser = await systemConfigurationService.retrieveAnonymousUserAccount();
  });

  after(async function () {
    sinon.restore();
    await UserAccount.updateOne({ id: anonymousUser.id }, { $set: { role: 'admin' } });
    await database.closeConnection();
  });

  afterEach(function () {
    sinon.restore();
  });

  async function setRole(role) {
    await UserAccount.updateOne({ id: anonymousUser.id }, { $set: { role } });
  }

  function api(method, path, body, status, query) {
    const call = request(app)
      [method](path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
    if (query) call.query(query);
    if (body !== undefined) call.send(body);
    return call.expect(status);
  }

  async function post(path, body, status = 200, query) {
    return (await api('post', path, body, status, query)).body;
  }

  it('requires admin role, exact confirmation, and a durable outcome record', async function () {
    await setRole('admin');
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Destructive authorization standard', type: 'standard' },
      201,
    );

    await setRole('editor');
    await api('delete', `/api/release-tracks/${track.id}`, undefined, 401, {
      confirm_track_id: track.id,
    });
    expect(await ReleaseTrackAuditEvent.countDocuments()).toBe(0);

    await setRole('admin');
    await api('delete', `/api/release-tracks/${track.id}`, undefined, 400);
    await api('delete', `/api/release-tracks/${track.id}`, undefined, 400, {
      confirm_track_id: 'release-track--00000000-0000-4000-8000-000000000099',
    });
    expect(await ReleaseTrackAuditEvent.countDocuments()).toBe(0);

    await api('delete', `/api/release-tracks/${track.id}`, undefined, 204, {
      confirm_track_id: track.id,
    });

    const events = await ReleaseTrackAuditEvent.find().sort({ started_at: 1 }).lean().exec();
    expect(events).toHaveLength(1);
    expect(events.map((event) => [event.action, event.status])).toEqual([
      ['delete_track', 'completed'],
    ]);
    expect(events[0]).toMatchObject({
      track_id: track.id,
      confirmation: track.id,
      actor: {
        user_account_id: anonymousUser.id,
        role: 'admin',
        authentication_strategy: 'anonymId',
      },
      result: { deleted: true },
    });
  });

  it('lets only administrators delete the most recent release, with confirmation and audit', async function () {
    await setRole('admin');
    const timestamp = new Date().toISOString();
    const technique = await post(
      '/api/techniques',
      {
        workspace: { workflow: { state: 'work-in-progress' } },
        stix: {
          type: 'attack-pattern',
          spec_version: '2.1',
          created: timestamp,
          modified: timestamp,
          name: 'Release deletion member',
          description: 'Member for release deletion tests.',
          kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
          x_mitre_is_subtechnique: false,
          x_mitre_domains: ['enterprise-attack'],
          x_mitre_platforms: ['Windows'],
          object_marking_refs: [markingDefinitionId],
        },
      },
      201,
    );
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Release deletion track', type: 'standard' },
      201,
    );
    const first = await releaseExactMembers(app, passportCookie, track.id, [technique], {
      version: '1.0',
    });
    await post(`/api/release-tracks/${track.id}/meta`, { description: 'next' }, 200);
    const second = await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      { version: '1.1' },
      200,
    );
    const secondPath = `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
      second.modified,
    )}`;
    const firstPath = `/api/release-tracks/${track.id}/snapshots/${encodeURIComponent(
      first.modified,
    )}`;

    // Editors cannot delete a release even with the right confirmation.
    await setRole('editor');
    await api('delete', secondPath, undefined, 403, { confirm_version: '1.1' });

    await setRole('admin');
    await api('delete', secondPath, undefined, 400);
    await api('delete', secondPath, undefined, 400, { confirm_version: '9.9' });
    expect(await ReleaseTrackAuditEvent.countDocuments({ action: 'delete_release' })).toBe(0);
    // Only the most recent release can be deleted; the rejected attempt is
    // audited as failed, like any confirmed destructive request.
    await api('delete', firstPath, undefined, 409, { confirm_version: '1.0' });
    expect(
      await ReleaseTrackAuditEvent.countDocuments({ action: 'delete_release', status: 'failed' }),
    ).toBe(1);

    await api('delete', secondPath, undefined, 204, { confirm_version: '1.1' });

    await api('get', secondPath, undefined, 404);
    const remaining = await api(
      'get',
      `/api/release-tracks/${track.id}/snapshots/latest`,
      undefined,
      200,
    );
    expect(remaining.body.version).toBe('1.0');
    expect(remaining.body.version_history.map((entry) => entry.version)).toEqual(['1.0']);
    expect(
      await ReleaseTrackContentManifest.countDocuments({
        manifest_id: second.content_manifest_id,
      }),
    ).toBe(0);
    const registry = await api('get', '/api/release-tracks', undefined, 200);
    const entry = registry.body.data.find((candidate) => candidate.track_id === track.id);
    expect(entry.tagged_release_count).toBe(1);
    expect(entry.latest_tagged_version).toBe('1.0');

    const event = await ReleaseTrackAuditEvent.findOne({
      action: 'delete_release',
      status: 'completed',
    })
      .lean()
      .exec();
    expect(event).toMatchObject({
      track_id: track.id,
      confirmation: '1.1',
      status: 'completed',
      request: { snapshot_modified: new Date(second.modified).toISOString() },
      result: { snapshot_modified: expect.any(Date), version: '1.1', members_count: 1 },
    });

    // The version is free again and the track keeps working.
    await post(`/api/release-tracks/${track.id}/meta`, { description: 'again' }, 200);
    const again = await post(
      `/api/release-tracks/${track.id}/snapshots/latest/release`,
      { version: '1.1' },
      200,
    );
    expect(again.version).toBe('1.1');
  });

  it('reports an audit-finalization failure without hiding the persisted mutation', async function () {
    await setRole('admin');
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Track deletion audit finalization failure', type: 'standard' },
      201,
    );

    sinon.stub(auditRepository, 'complete').rejects(new Error('injected audit update failure'));
    const response = await api('delete', `/api/release-tracks/${track.id}`, undefined, 500, {
      confirm_track_id: track.id,
    });
    auditRepository.complete.restore();

    expect(response.body).toMatchObject({
      message: 'Release-track audit recording could not be finalized',
      track_id: track.id,
    });
    expect(response.body.audit_event_id).toEqual(expect.any(String));

    await api('get', `/api/release-tracks/${track.id}/snapshots/latest`, undefined, 404);

    const pendingEvent = await ReleaseTrackAuditEvent.findOne({
      event_id: response.body.audit_event_id,
    })
      .lean()
      .exec();
    expect(pendingEvent).toMatchObject({
      action: 'delete_track',
      track_id: track.id,
      status: 'pending',
    });
    expect(pendingEvent.finished_at).toBeNull();
  });
});
