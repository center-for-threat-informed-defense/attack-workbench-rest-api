'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const ReleaseTrackRegistry = require('../../../models/release-tracks/release-track-registry-model');
const releaseTracksService = require('../../../services/release-tracks/release-tracks-service');

describe('Virtual release-track snapshot schedule validation API', function () {
  let app;
  let passportCookie;
  let createSequence = 0;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  async function createTrack(snapshotSchedule, status = 201, type = 'virtual') {
    createSequence += 1;
    const name = `Schedule Validation ${createSequence}`;
    const response = await request(app)
      .post('/api/release-tracks/new')
      .send({
        name,
        type,
        snapshot_schedule: snapshotSchedule,
      })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
    return { name, body: response.body };
  }

  async function getRegistryTrack(search) {
    const response = await request(app)
      .get('/api/release-tracks')
      .query({ search })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    return response.body.data[0];
  }

  it('accepts and persists the fields defined by each schedule mode', async function () {
    const schedules = [
      { mode: 'manual' },
      { mode: 'cron', cron: '0 0 1 1,7 *' },
      {
        mode: 'dates',
        dates: ['2027-01-15T00:00:00.000Z', '2027-07-15T00:00:00.000Z'],
      },
    ];

    for (const schedule of schedules) {
      const created = await createTrack(schedule);
      const registryTrack = await getRegistryTrack(created.name);
      expect(registryTrack.snapshot_schedule).toEqual(schedule);
    }
  });

  it('rejects fields that do not apply to manual schedules', async function () {
    const invalidSchedules = [
      { mode: 'manual', cron: '0 0 1 1,7 *' },
      { mode: 'manual', dates: ['2027-01-15T00:00:00.000Z'] },
      { mode: 'manual', unexpected: true },
    ];

    for (const schedule of invalidSchedules) {
      await createTrack(schedule, 400);
    }
  });

  it('requires cron and rejects dates for cron schedules', async function () {
    const invalidSchedules = [
      { mode: 'cron' },
      {
        mode: 'cron',
        cron: '0 0 1 1,7 *',
        dates: ['2027-01-15T00:00:00.000Z'],
      },
      { mode: 'cron', cron: '0 0 1 1,7 * 2027' },
    ];

    for (const schedule of invalidSchedules) {
      await createTrack(schedule, 400);
    }
  });

  it('requires non-empty dates and rejects cron for dates schedules', async function () {
    const invalidSchedules = [
      { mode: 'dates' },
      { mode: 'dates', dates: [] },
      {
        mode: 'dates',
        dates: ['2027-01-15T00:00:00.000Z'],
        cron: '0 0 1 1,7 *',
      },
    ];

    for (const schedule of invalidSchedules) {
      await createTrack(schedule, 400);
    }
  });

  it('rejects snapshot schedules on standard tracks', async function () {
    await createTrack({ mode: 'manual' }, 400, 'standard');
  });

  it('repeats schedule validation for non-HTTP service callers', async function () {
    const registryCountBefore = await ReleaseTrackRegistry.countDocuments();

    const invalidTracks = [
      {
        name: 'Invalid Service Schedule',
        type: 'virtual',
        snapshot_schedule: { mode: 'cron' },
      },
      {
        name: 'Invalid Standard Service Schedule',
        type: 'standard',
        snapshot_schedule: { mode: 'manual' },
      },
    ];

    for (const track of invalidTracks) {
      await expect(releaseTracksService.createTrack(track)).rejects.toThrow();
    }

    expect(await ReleaseTrackRegistry.countDocuments()).toBe(registryCountBefore);
  });

  it('repeats mode validation at the persistence boundary', async function () {
    const invalidRegistries = [
      {
        type: 'virtual',
        name: 'Invalid Persistence Schedule',
        snapshot_schedule: {
          mode: 'manual',
          cron: '0 0 1 1,7 *',
        },
      },
      {
        type: 'standard',
        name: 'Invalid Standard Persistence Schedule',
        snapshot_schedule: {
          mode: 'manual',
        },
      },
    ];

    for (const invalidRegistry of invalidRegistries) {
      const registry = new ReleaseTrackRegistry({
        track_id: 'release-track--11111111-1111-4111-8111-111111111111',
        created_at: new Date(),
        updated_at: new Date(),
        ...invalidRegistry,
      });
      await expect(registry.validate()).rejects.toThrow();
    }
  });
});
