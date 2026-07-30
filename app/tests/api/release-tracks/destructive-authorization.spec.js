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
