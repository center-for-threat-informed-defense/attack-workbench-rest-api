'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');
const migration = require('../../../../migrations/20260730180000-backfill-deterministic-snapshot-graphs');
const Relationship = require('../../../models/relationship-model');
const {
  ReleaseTrackGraphManifest,
  ReleaseTrackGraphManifestEntry,
} = require('../../../models/release-tracks/release-track-graph-manifest-model');
const { releaseExactMembers } = require('./release-track-test-helpers');

const markingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Deterministic snapshot graph migration', function () {
  let app;
  let passportCookie;
  let technique;
  let group;
  let relationship;
  let trackId;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();
    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;
    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  async function post(path, body, status = 201) {
    const response = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(status);
    return response.body;
  }

  before('create and then downgrade representative legacy data', async function () {
    const timestamp = new Date().toISOString();
    technique = await post('/api/techniques', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        type: 'attack-pattern',
        spec_version: '2.1',
        created: timestamp,
        modified: timestamp,
        name: 'Migration graph technique',
        description: 'A primary migration fixture.',
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
        x_mitre_is_subtechnique: false,
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_platforms: ['Windows'],
        object_marking_refs: [markingDefinitionId],
      },
    });
    group = await post('/api/groups', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        type: 'intrusion-set',
        spec_version: '2.1',
        created: timestamp,
        modified: timestamp,
        name: 'Migration graph secondary',
        description: 'A secondary migration fixture.',
        object_marking_refs: [markingDefinitionId],
      },
    });
    relationship = await post('/api/relationships', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        type: 'relationship',
        spec_version: '2.1',
        created: timestamp,
        modified: timestamp,
        relationship_type: 'uses',
        source_ref: group.stix.id,
        target_ref: technique.stix.id,
        object_marking_refs: [markingDefinitionId],
      },
    });
    const track = await post(
      '/api/release-tracks/new',
      { name: 'Legacy migration track', type: 'standard' },
      201,
    );
    trackId = track.id;
    await releaseExactMembers(app, passportCookie, trackId, [technique]);

    await Relationship.updateOne(
      {
        'stix.id': relationship.stix.id,
        'stix.modified': relationship.stix.modified,
      },
      { $unset: { 'workspace.relationship_endpoints': '' } },
    );
    await mongoose.connection.db
      .collection(trackId)
      .updateMany({}, { $unset: { graph_manifest_id: '' } });
    await Promise.all([
      ReleaseTrackGraphManifest.deleteMany({ track_id: trackId }),
      ReleaseTrackGraphManifestEntry.deleteMany({ track_id: trackId }),
    ]);
  });

  it('supports a non-mutating dry run', async function () {
    const report = await migration._private.run(mongoose.connection.db, {
      dryRun: true,
    });

    expect(report.dry_run).toBe(true);
    expect(report.relationship_pins_written).toBeGreaterThan(0);
    expect(report.manifests_created).toBeGreaterThan(0);
    const storedRelationship = await Relationship.findOne({
      'stix.id': relationship.stix.id,
    })
      .lean()
      .exec();
    expect(storedRelationship.workspace.relationship_endpoints).toBeUndefined();
    expect(await ReleaseTrackGraphManifest.countDocuments({ track_id: trackId })).toBe(0);
  });

  it('pins latest relationships and rerunnably backfills baseline manifests', async function () {
    await migration.up(mongoose.connection.db);

    const storedRelationship = await Relationship.findOne({
      'stix.id': relationship.stix.id,
    })
      .lean()
      .exec();
    expect(storedRelationship.workspace.relationship_endpoints.source).toEqual({
      object_ref: group.stix.id,
      object_modified: new Date(group.stix.modified),
    });
    expect(storedRelationship.workspace.relationship_endpoints.target).toEqual({
      object_ref: technique.stix.id,
      object_modified: new Date(technique.stix.modified),
    });

    const manifests = await ReleaseTrackGraphManifest.find({
      track_id: trackId,
    })
      .lean()
      .exec();
    expect(manifests.length).toBeGreaterThan(0);
    expect(manifests.every((manifest) => manifest.baseline_reconstruction === true)).toBe(true);
    const countAfterFirstRun = manifests.length;

    await migration.up(mongoose.connection.db);
    expect(await ReleaseTrackGraphManifest.countDocuments({ track_id: trackId })).toBe(
      countAfterFirstRun,
    );

    const response = await request(app)
      .get(`/api/release-tracks/${trackId}/snapshots/latest?format=bundle&includeToc=false`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);
    const objectIds = response.body.objects.map((object) => object.id);
    expect(objectIds).toContain(technique.stix.id);
    expect(objectIds).toContain(group.stix.id);
    expect(objectIds).toContain(relationship.stix.id);
  });

  it('replays and activates a complete linked pending manifest after interruption', async function () {
    const snapshot = await mongoose.connection.db
      .collection(trackId)
      .findOne({}, { sort: { modified: -1 } });
    await ReleaseTrackGraphManifest.updateOne(
      { manifest_id: snapshot.graph_manifest_id },
      { $set: { state: 'pending' } },
    ).exec();

    await request(app)
      .get(`/api/release-tracks/${trackId}/snapshots/latest?format=bundle&includeToc=false`)
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);

    const manifest = await ReleaseTrackGraphManifest.findOne({
      manifest_id: snapshot.graph_manifest_id,
    })
      .lean()
      .exec();
    expect(manifest.state).toBe('active');
  });

  after(async function () {
    await database.closeConnection();
  });
});
