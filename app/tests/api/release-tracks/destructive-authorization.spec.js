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

const markingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';

function techniquePayload() {
  const timestamp = new Date().toISOString();
  return {
    workspace: { workflow: { state: 'work-in-progress' } },
    stix: {
      created: timestamp,
      modified: timestamp,
      name: 'Destructive authorization member',
      description: 'Member used by destructive authorization tests.',
      spec_version: '2.1',
      type: 'attack-pattern',
      object_marking_refs: [markingDefinitionId],
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
      x_mitre_is_subtechnique: false,
      x_mitre_platforms: ['Windows'],
    },
  };
}

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

  it('requires admin role, exact confirmation, and durable outcome records', async function () {
    await setRole('admin');
    const technique = await post('/api/techniques', techniquePayload(), 201);
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Destructive authorization standard', type: 'standard' },
      201,
    );
    const contents = {
      x_mitre_contents: [
        {
          obj_ref: technique.stix.id,
          obj_modified: technique.stix.modified,
        },
      ],
    };

    await setRole('editor');
    await api('post', `/api/release-tracks/${track.id}/contents`, contents, 401, {
      confirm_track_id: track.id,
    });
    await api(
      'post',
      `/api/release-tracks/${track.id}/snapshots/${track.modified}/contents`,
      contents,
      401,
      { confirm_track_id: track.id },
    );
    await api('delete', `/api/release-tracks/${track.id}`, undefined, 401, {
      confirm_track_id: track.id,
    });
    expect(await ReleaseTrackAuditEvent.countDocuments()).toBe(0);

    await setRole('admin');
    await api('post', `/api/release-tracks/${track.id}/contents`, contents, 400);
    await api('post', `/api/release-tracks/${track.id}/contents`, contents, 400, {
      confirm_track_id: 'release-track--00000000-0000-4000-8000-000000000099',
    });
    await api('delete', `/api/release-tracks/${track.id}`, undefined, 400);
    expect(await ReleaseTrackAuditEvent.countDocuments()).toBe(0);

    const latest = await post(`/api/release-tracks/${track.id}/contents`, contents, 200, {
      confirm_track_id: track.id,
    });
    await post(
      `/api/release-tracks/${track.id}/snapshots/${track.modified}/contents`,
      contents,
      200,
      { confirm_track_id: track.id },
    );

    const virtual = await post(
      '/api/release-tracks/new',
      { name: 'Destructive authorization virtual', type: 'virtual' },
      201,
    );
    await api('post', `/api/release-tracks/${virtual.id}/contents`, contents, 400, {
      confirm_track_id: virtual.id,
    });

    await api('delete', `/api/release-tracks/${track.id}`, undefined, 204, {
      confirm_track_id: track.id,
    });

    const events = await ReleaseTrackAuditEvent.find().sort({ started_at: 1 }).lean().exec();
    expect(events).toHaveLength(4);
    expect(events.map((event) => [event.action, event.status])).toEqual([
      ['replace_members_latest', 'completed'],
      ['replace_members_historical', 'completed'],
      ['replace_members_latest', 'failed'],
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
      request: { members_count: 1 },
      result: {
        snapshot_modified: new Date(latest.modified),
        members_count: 1,
      },
    });
    expect(events[2].track_id).toBe(virtual.id);
    expect(events[2].error.message).toContain(
      'Direct contents updates are only available for standard release tracks',
    );
    expect(events[3].result).toEqual({ deleted: true });
  });

  it('reports an audit-finalization failure without hiding the persisted mutation', async function () {
    await setRole('admin');
    const technique = await post('/api/techniques', techniquePayload(), 201);
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Audit finalization failure standard', type: 'standard' },
      201,
    );
    const contents = {
      x_mitre_contents: [
        {
          obj_ref: technique.stix.id,
          obj_modified: technique.stix.modified,
        },
      ],
    };

    sinon.stub(auditRepository, 'complete').rejects(new Error('injected audit update failure'));
    const response = await api('post', `/api/release-tracks/${track.id}/contents`, contents, 500, {
      confirm_track_id: track.id,
    });
    auditRepository.complete.restore();

    expect(response.body).toMatchObject({
      message: 'Release-track audit recording could not be finalized',
      track_id: track.id,
    });
    expect(response.body.audit_event_id).toEqual(expect.any(String));

    const latest = await api(
      'get',
      `/api/release-tracks/${track.id}/snapshots/latest`,
      undefined,
      200,
    );
    expect(latest.body.members).toHaveLength(1);
    expect(latest.body.members[0]).toMatchObject({
      object_ref: technique.stix.id,
      object_modified: technique.stix.modified,
    });

    const pendingEvent = await ReleaseTrackAuditEvent.findOne({
      event_id: response.body.audit_event_id,
    })
      .lean()
      .exec();
    expect(pendingEvent).toMatchObject({
      action: 'replace_members_latest',
      track_id: track.id,
      status: 'pending',
    });
    expect(pendingEvent.finished_at).toBeNull();
  });
});
