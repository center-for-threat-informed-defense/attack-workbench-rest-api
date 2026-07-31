'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const modelFactory = require('../../../models/release-tracks/model-factory');
const releaseTracksService = require('../../../services/release-tracks/release-tracks-service');

describe('Virtual release-track scheduled materialization API', function () {
  let app;
  let passportCookie;

  const createdMaterialization = {
    schedule_mode: 'dates',
    scheduled_for: '2027-01-15T00:00:00.000Z',
  };
  const updatedMaterialization = {
    schedule_mode: 'cron',
    scheduled_for: '2027-07-15T00:00:00.000Z',
  };
  const snapshotMaterialization = {
    schedule_mode: 'dates',
    scheduled_for: '2028-01-15T00:00:00.000Z',
  };

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  function api(method, path) {
    return request(app)
      [method](path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
  }

  it('persists a client-supplied value on virtual-track creation and every GET representation', async function () {
    const createResponse = await api('post', '/api/release-tracks/new')
      .send({
        name: 'Scheduled Materialization Create',
        type: 'virtual',
        scheduled_materialization: createdMaterialization,
      })
      .expect(201);

    expect(createResponse.body.scheduled_materialization).toEqual(createdMaterialization);
    const trackId = createResponse.body.id;
    const modified = createResponse.body.modified;

    const latestResponse = await api(
      'get',
      `/api/release-tracks/${trackId}/snapshots/latest`,
    ).expect(200);
    expect(latestResponse.body.scheduled_materialization).toEqual(createdMaterialization);

    const selectedResponse = await api(
      'get',
      `/api/release-tracks/${trackId}/snapshots/${modified}`,
    ).expect(200);
    expect(selectedResponse.body.scheduled_materialization).toEqual(createdMaterialization);

    const historyResponse = await api('get', `/api/release-tracks/${trackId}/snapshots`).expect(
      200,
    );
    expect(historyResponse.body.data[0].scheduled_materialization).toEqual(createdMaterialization);

    const listResponse = await api('get', '/api/release-tracks')
      .query({ search: 'Scheduled Materialization Create' })
      .expect(200);
    expect(listResponse.body.data[0].scheduled_materialization).toEqual(createdMaterialization);
  });

  it('persists a client-supplied value on virtual composition update and every GET representation', async function () {
    const componentResponse = await api('post', '/api/release-tracks/new')
      .send({
        name: 'Scheduled Materialization Component',
        type: 'standard',
      })
      .expect(201);

    const virtualResponse = await api('post', '/api/release-tracks/new')
      .send({
        name: 'Scheduled Materialization Update',
        type: 'virtual',
      })
      .expect(201);

    const updateResponse = await api(
      'put',
      `/api/release-tracks/${virtualResponse.body.id}/virtual/composition`,
    )
      .send({
        component_tracks: [
          {
            track_id: componentResponse.body.id,
            resolution_strategy: 'latest_tagged',
            priority: 0,
          },
        ],
        scheduled_materialization: updatedMaterialization,
      })
      .expect(200);

    expect(updateResponse.body.scheduled_materialization).toEqual(updatedMaterialization);
    const trackId = virtualResponse.body.id;
    const modified = updateResponse.body.modified;

    const latestResponse = await api(
      'get',
      `/api/release-tracks/${trackId}/snapshots/latest`,
    ).expect(200);
    expect(latestResponse.body.scheduled_materialization).toEqual(updatedMaterialization);

    const selectedResponse = await api(
      'get',
      `/api/release-tracks/${trackId}/snapshots/${modified}`,
    ).expect(200);
    expect(selectedResponse.body.scheduled_materialization).toEqual(updatedMaterialization);

    const historyResponse = await api('get', `/api/release-tracks/${trackId}/snapshots`).expect(
      200,
    );
    expect(historyResponse.body.data[0].scheduled_materialization).toEqual(updatedMaterialization);

    const listResponse = await api('get', '/api/release-tracks')
      .query({ search: 'Scheduled Materialization Update' })
      .expect(200);
    expect(listResponse.body.data[0].scheduled_materialization).toEqual(updatedMaterialization);

    await api('put', `/api/release-tracks/${trackId}/virtual/composition`)
      .send({
        component_tracks: [
          {
            track_id: componentResponse.body.id,
            resolution_strategy: 'latest_tagged',
            priority: 0,
          },
        ],
        scheduled_materialization: {
          ...updatedMaterialization,
          unexpected: true,
        },
      })
      .expect(400);
  });

  it('persists a client-supplied value on explicit virtual snapshot creation', async function () {
    const componentResponse = await api('post', '/api/release-tracks/new')
      .send({
        name: 'Explicit Materialization Component',
        type: 'standard',
      })
      .expect(201);

    await api('post', `/api/release-tracks/${componentResponse.body.id}/snapshots/latest/release`)
      .send({})
      .expect(200);

    const virtualResponse = await api('post', '/api/release-tracks/new')
      .send({
        name: 'Explicit Scheduled Materialization',
        type: 'virtual',
        composition: {
          component_tracks: [
            {
              track_id: componentResponse.body.id,
              resolution_strategy: 'latest_tagged',
              priority: 0,
            },
          ],
        },
      })
      .expect(201);

    const materializedResponse = await api(
      'post',
      `/api/release-tracks/${virtualResponse.body.id}/virtual/snapshots/create`,
    )
      .send({
        description: 'Client-attributed materialization',
        scheduled_materialization: snapshotMaterialization,
      })
      .expect(201);

    expect(materializedResponse.body.scheduled_materialization).toEqual(snapshotMaterialization);

    const latestResponse = await api(
      'get',
      `/api/release-tracks/${virtualResponse.body.id}/snapshots/latest`,
    ).expect(200);
    expect(latestResponse.body.scheduled_materialization).toEqual(snapshotMaterialization);

    await api('post', `/api/release-tracks/${virtualResponse.body.id}/virtual/snapshots/create`)
      .send({
        scheduled_materialization: {
          schedule_mode: 'manual',
          scheduled_for: '2028-07-15T00:00:00.000Z',
        },
      })
      .expect(400);
  });

  it('rejects scheduled materialization on standard tracks and malformed virtual payloads', async function () {
    await api('post', '/api/release-tracks/new')
      .send({
        name: 'Invalid Standard Materialization',
        type: 'standard',
        scheduled_materialization: createdMaterialization,
      })
      .expect(400);

    const malformedValues = [
      {
        schedule_mode: 'manual',
        scheduled_for: '2027-01-15T00:00:00.000Z',
      },
      {
        schedule_mode: 'cron',
      },
      {
        schedule_mode: 'dates',
        scheduled_for: 'not-a-date',
      },
      {
        ...createdMaterialization,
        unexpected: true,
      },
    ];

    for (const scheduledMaterialization of malformedValues) {
      await api('post', '/api/release-tracks/new')
        .send({
          name: 'Invalid Virtual Materialization',
          type: 'virtual',
          scheduled_materialization: scheduledMaterialization,
        })
        .expect(400);
    }
  });

  it('repeats validation for non-HTTP service and persistence callers', async function () {
    await expect(
      releaseTracksService.createTrack({
        name: 'Invalid Service Materialization',
        type: 'standard',
        scheduled_materialization: createdMaterialization,
      }),
    ).rejects.toThrow('Scheduled materialization is only available');

    await expect(
      releaseTracksService.createTrack({
        name: 'Malformed Service Materialization',
        type: 'virtual',
        scheduled_materialization: {
          schedule_mode: 'dates',
          scheduled_for: 'not-a-date',
        },
      }),
    ).rejects.toThrow('Invalid scheduled materialization');

    const trackId = 'release-track--11111111-1111-4111-8111-111111111111';
    const Model = modelFactory.getModel(trackId);
    const invalidSnapshot = new Model({
      id: trackId,
      type: 'standard',
      modified: new Date(),
      version: null,
      name: 'Invalid Persistence Materialization',
      created: new Date(),
      scheduled_materialization: createdMaterialization,
    });

    await expect(invalidSnapshot.validate()).rejects.toThrow(
      'Scheduled materialization is only valid for virtual tracks',
    );
  });
});
