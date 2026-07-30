'use strict';

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const ReleaseTrackRegistry = require('../../../models/release-tracks/release-track-registry-model');

const markingDefinitionId = 'marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168';

function buildTechnique(name, previous) {
  const timestamp = previous
    ? new Date(new Date(previous.stix.modified).getTime() + 1000).toISOString()
    : new Date().toISOString();
  return {
    workspace: { workflow: { state: 'work-in-progress' } },
    stix: {
      id: previous?.stix.id,
      created: previous?.stix.created || timestamp,
      modified: timestamp,
      name,
      description: `${name} description`,
      spec_version: '2.1',
      type: 'attack-pattern',
      object_marking_refs: [markingDefinitionId],
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
      x_mitre_is_subtechnique: false,
      x_mitre_platforms: ['Windows'],
    },
  };
}

describe('Release-track authoritative tagged-content immutability', function () {
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

  async function api(method, path, body, status) {
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

  it('blocks mutation from historical tagged membership when current backrefs are absent', async function () {
    const technique = await post('/api/techniques', buildTechnique('Historical Member'), 201);
    const replacement = await post('/api/techniques', buildTechnique('Current Draft Member'), 201);
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Historical Immutability', type: 'standard' },
      201,
    );
    await post(`/api/release-tracks/${track.id}/contents?confirm_track_id=${track.id}`, {
      x_mitre_contents: [{ obj_ref: technique.stix.id, obj_modified: technique.stix.modified }],
    });
    await post(`/api/release-tracks/${track.id}/snapshots/latest/release`, { version: '1.0' });

    // A newer draft removes the member, so latest-snapshot reconciliation
    // deliberately removes the object's denormalized backref. The historical
    // tagged snapshot remains the immutable authority.
    await post(`/api/release-tracks/${track.id}/contents?confirm_track_id=${track.id}`, {
      x_mitre_contents: [{ obj_ref: replacement.stix.id, obj_modified: replacement.stix.modified }],
    });
    const current = (
      await api(
        'get',
        `/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`,
        undefined,
        200,
      )
    ).body;
    expect(current.workspace.release_tracks || []).toHaveLength(0);

    // Clear the registry's denormalized tagged-release catalogue as well.
    // The guard must query tagged snapshots, not either derived index.
    await ReleaseTrackRegistry.updateOne(
      { track_id: track.id },
      {
        $set: {
          tagged_releases: [],
          tagged_release_count: 0,
          latest_tagged_version: null,
        },
      },
    );

    const updated = buildTechnique('Historical Member (edited)', technique);
    updated.stix.modified = technique.stix.modified;
    const putResponse = await api(
      'put',
      `/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`,
      updated,
      409,
    );
    expect(putResponse.body.release_tracks).toEqual([track.id]);
    expect(putResponse.body.tagged_releases).toEqual([
      expect.objectContaining({
        track_id: track.id,
        version: '1.0',
        object_ref: technique.stix.id,
        object_modified: technique.stix.modified,
      }),
    ]);

    await api(
      'delete',
      `/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`,
      undefined,
      409,
    );
    await api('delete', `/api/techniques/${technique.stix.id}`, undefined, 409);

    await api(
      'get',
      `/api/techniques/${technique.stix.id}/modified/${technique.stix.modified}`,
      undefined,
      200,
    );
  });
});
