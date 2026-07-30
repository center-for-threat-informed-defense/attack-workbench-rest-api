/**
 * Release Track Snapshot Bundle Export Tests
 * ===========================================
 *
 * Regression tests for the `format=bundle` output format on the snapshot
 * retrieval endpoints:
 *
 *   - GET /api/release-tracks/:id/snapshots/latest
 *   - GET /api/release-tracks/:id/snapshots/:modified
 *
 * Covered behavior:
 *   - Default bundle contains members only, plus referenced identities and
 *     marking definitions (self-contained bundle)
 *   - Active relationships whose endpoints are both selected are added
 *     dynamically; relationships with an endpoint outside the export are not
 *   - `include` adds staged and/or candidate tiers (comma-separated or
 *     repeated, singular or plural tier names)
 *   - `state` narrows the included staged/candidate entries by workflow
 *     status; entries marked 'reviewed' are always included
 *   - `stixVersion` controls bundle/object STIX version conformance
 *   - `includeToc` controls the x-mitre-collection table-of-contents object,
 *     which is derived from the release-track metadata
 *   - LinkById tags are converted to markdown citations
 *   - Invalid `include`/`state` values are rejected with 400
 */

const request = require('supertest');
const { expect } = require('expect');

const config = require('../../../config/config');
const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// Seeded by databaseConfiguration.checkSystemConfiguration()
const staticMarkingDefinitionId = 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9';

describe('Release Tracks Bundle Export API', function () {
  let app;
  let passportCookie;

  // The organization identity stamped onto created objects by the server
  let organizationIdentityId;
  let trackId;
  let trackUuid;
  let snapshotModified;

  let memberObject;
  let linkedMemberObject;
  let relationshipSource;
  let includedRelationship;
  let excludedRelationship;
  let linkedAttackId;
  let linkedAttackUrl;
  let candidateWip;
  let candidateAwaitingReview;
  let candidateReviewed;
  let stagedObject;

  before(async function () {
    await database.initializeConnection();
    await databaseConfiguration.checkSystemConfiguration();

    config.validateRequests.withAttackDataModel = true;
    config.validateRequests.withOpenApi = true;

    app = await require('../../../index').initializeApp();
    passportCookie = await login.loginAnonymous(app);
  });

  async function postObject(path, body) {
    const res = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);
    return res.body;
  }

  async function postAction(path, body, expectedStatus = 200) {
    const res = await request(app)
      .post(path)
      .send(body)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(expectedStatus);
    return res.body;
  }

  async function getBundle(path, expectedStatus = 200) {
    const res = await request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(expectedStatus);
    return res.body;
  }

  function buildTechnique(name, overrides = {}) {
    const timestamp = new Date().toISOString();
    return {
      workspace: {
        workflow: {
          state: 'work-in-progress',
        },
      },
      stix: {
        created: timestamp,
        modified: timestamp,
        name,
        description: `Description for ${name}`,
        spec_version: '2.1',
        type: 'attack-pattern',
        object_marking_refs: [staticMarkingDefinitionId],
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'persistence' }],
        x_mitre_is_subtechnique: false,
        x_mitre_platforms: ['Windows'],
        ...overrides,
      },
    };
  }

  function bundleObjectIds(bundle) {
    return bundle.objects.map((o) => o.id);
  }

  before('set up release track with tiered contents', async function () {
    // The server auto-generates an ATT&CK ID (and matching external reference)
    // for techniques; LinkById tags resolve against that generated ID
    linkedMemberObject = await postObject('/api/techniques', buildTechnique('Linked Technique'));
    linkedAttackId = linkedMemberObject.workspace.attack_id;
    const linkedAttackRef = (linkedMemberObject.stix.external_references || []).find(
      (ref) => ref.external_id === linkedAttackId,
    );
    linkedAttackUrl = linkedAttackRef?.url || '';

    // The server stamps created_by_ref with the organization identity
    organizationIdentityId = linkedMemberObject.stix.created_by_ref;

    // Member whose description references the linked technique
    memberObject = await postObject(
      '/api/techniques',
      buildTechnique('Member Technique', {
        description: `See (LinkById: ${linkedAttackId}) for details.`,
      }),
    );

    candidateWip = await postObject('/api/techniques', buildTechnique('Candidate WIP'));
    candidateAwaitingReview = await postObject(
      '/api/techniques',
      buildTechnique('Candidate Awaiting Review'),
    );
    candidateReviewed = await postObject('/api/techniques', buildTechnique('Candidate Reviewed'));
    stagedObject = await postObject('/api/techniques', buildTechnique('Staged Technique'));
    relationshipSource = await postObject('/api/groups', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: 'Bundle Relationship Group',
        description: 'Group used to verify dynamic relationship inclusion.',
        spec_version: '2.1',
        type: 'intrusion-set',
        object_marking_refs: [staticMarkingDefinitionId],
      },
    });
    includedRelationship = await postObject('/api/relationships', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        spec_version: '2.1',
        type: 'relationship',
        relationship_type: 'uses',
        source_ref: relationshipSource.stix.id,
        target_ref: memberObject.stix.id,
        object_marking_refs: [staticMarkingDefinitionId],
      },
    });
    excludedRelationship = await postObject('/api/relationships', {
      workspace: { workflow: { state: 'work-in-progress' } },
      stix: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        spec_version: '2.1',
        type: 'relationship',
        relationship_type: 'uses',
        source_ref: relationshipSource.stix.id,
        target_ref: candidateWip.stix.id,
        object_marking_refs: [staticMarkingDefinitionId],
      },
    });

    const track = await postAction(
      '/api/release-tracks/new',
      {
        name: 'Bundle Test Track',
        description: 'Release track bundle export test',
        type: 'standard',
      },
      201,
    );
    trackId = track.id;
    trackUuid = trackId.split('--')[1];

    // Disable auto-promotion so reviewed candidates stay in the candidates tier
    await request(app)
      .put(`/api/release-tracks/${trackId}/config`)
      .send({ auto_promote: false })
      .set('Accept', 'application/json')
      .set('Cookie', `${passportCookie.name}=${passportCookie.value}`)
      .expect(200);

    // Members
    await postAction(`/api/release-tracks/${trackId}/contents?confirm_track_id=${trackId}`, {
      x_mitre_contents: [
        { obj_ref: memberObject.stix.id, obj_modified: memberObject.stix.modified },
        { obj_ref: linkedMemberObject.stix.id, obj_modified: linkedMemberObject.stix.modified },
        { obj_ref: relationshipSource.stix.id, obj_modified: relationshipSource.stix.modified },
      ],
    });

    // Candidates (all start as work-in-progress)
    await postAction(`/api/release-tracks/${trackId}/candidates`, {
      object_refs: [
        { id: candidateWip.stix.id, modified: candidateWip.stix.modified },
        { id: candidateAwaitingReview.stix.id, modified: candidateAwaitingReview.stix.modified },
        { id: candidateReviewed.stix.id, modified: candidateReviewed.stix.modified },
        { id: stagedObject.stix.id, modified: stagedObject.stix.modified },
      ],
    });

    // Transition candidate statuses
    await postAction(`/api/release-tracks/${trackId}/candidates/review`, {
      from: 'work-in-progress',
      to: 'awaiting-review',
      object_refs: [candidateAwaitingReview.stix.id],
    });
    await postAction(`/api/release-tracks/${trackId}/candidates/review`, {
      from: 'work-in-progress',
      to: 'reviewed',
      object_refs: [candidateReviewed.stix.id],
    });

    // Promote one candidate to staged (retains work-in-progress status)
    const promoteRes = await postAction(`/api/release-tracks/${trackId}/candidates/promote`, {
      object_refs: [stagedObject.stix.id],
    });
    snapshotModified = promoteRes.modified;
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle returns a members-only STIX 2.1 bundle', async function () {
    const bundle = await getBundle(`/api/release-tracks/${trackId}/snapshots/latest?format=bundle`);

    expect(bundle.type).toBe('bundle');
    expect(bundle.id).toMatch(/^bundle--/);
    // STIX 2.1 removed spec_version from the bundle object
    expect(bundle.spec_version).toBeUndefined();

    const ids = bundleObjectIds(bundle);
    expect(ids).toContain(memberObject.stix.id);
    expect(ids).toContain(linkedMemberObject.stix.id);

    // Tier entries not selected via include are excluded
    expect(ids).not.toContain(candidateWip.stix.id);
    expect(ids).not.toContain(candidateAwaitingReview.stix.id);
    expect(ids).not.toContain(candidateReviewed.stix.id);
    expect(ids).not.toContain(stagedObject.stix.id);

    // Referenced supporting objects are included so the bundle is self-contained
    expect(ids).toContain(organizationIdentityId);
    expect(ids).toContain(staticMarkingDefinitionId);

    // Objects conform to STIX 2.1
    const member = bundle.objects.find((o) => o.id === memberObject.stix.id);
    expect(member.spec_version).toBe('2.1');

    // Bundle objects contain STIX properties only (no workspace/workflow data)
    expect(member.workspace).toBeUndefined();
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle includes a TOC derived from the track metadata', async function () {
    const bundle = await getBundle(`/api/release-tracks/${trackId}/snapshots/latest?format=bundle`);

    const toc = bundle.objects[0];
    expect(toc.type).toBe('x-mitre-collection');
    expect(toc.id).toBe(`x-mitre-collection--${trackUuid}`);
    expect(toc.name).toBe('Bundle Test Track');
    // Draft snapshots (version: null) fall back to '0.1'
    expect(toc.x_mitre_version).toBe('0.1');
    expect(toc.x_mitre_attack_spec_version).toBe(config.app.attackSpecVersion);
    expect(toc.spec_version).toBe('2.1');

    // Marking definitions are tracked in object_marking_refs, everything else
    // in x_mitre_contents
    expect(toc.object_marking_refs).toContain(staticMarkingDefinitionId);
    const contentRefs = toc.x_mitre_contents.map((entry) => entry.object_ref);
    expect(contentRefs).toContain(memberObject.stix.id);
    expect(contentRefs).toContain(includedRelationship.stix.id);
    expect(contentRefs).toContain(organizationIdentityId);
    expect(contentRefs).not.toContain(staticMarkingDefinitionId);
    expect(contentRefs).not.toContain(toc.id);
  });

  it('adds only relationships whose endpoints are both selected for the bundle', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&includeToc=false`,
    );
    const ids = bundleObjectIds(bundle);

    expect(ids).toContain(includedRelationship.stix.id);
    expect(ids).not.toContain(excludedRelationship.stix.id);

    const snapshot = await getBundle(`/api/release-tracks/${trackId}/snapshots/latest`);
    expect(snapshot.members.map((member) => member.object_ref)).not.toContain(
      includedRelationship.stix.id,
    );
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle&includeToc=false omits the TOC', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&includeToc=false`,
    );
    const tocObjects = bundle.objects.filter((o) => o.type === 'x-mitre-collection');
    expect(tocObjects.length).toBe(0);
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle converts LinkById tags to markdown citations', async function () {
    const bundle = await getBundle(`/api/release-tracks/${trackId}/snapshots/latest?format=bundle`);
    const member = bundle.objects.find((o) => o.id === memberObject.stix.id);
    expect(member.description).toBe(`See [Linked Technique](${linkedAttackUrl}) for details.`);
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle&include=candidates adds the candidates tier', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=candidates`,
    );

    const ids = bundleObjectIds(bundle);
    expect(ids).toContain(memberObject.stix.id);
    expect(ids).toContain(candidateWip.stix.id);
    expect(ids).toContain(candidateAwaitingReview.stix.id);
    expect(ids).toContain(candidateReviewed.stix.id);
    expect(ids).not.toContain(stagedObject.stix.id);
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle&include=staged adds the staged tier', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=staged`,
    );

    const ids = bundleObjectIds(bundle);
    expect(ids).toContain(memberObject.stix.id);
    expect(ids).toContain(stagedObject.stix.id);
    expect(ids).not.toContain(candidateWip.stix.id);
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle&include=candidates,staged adds both tiers', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=candidates,staged`,
    );

    const ids = bundleObjectIds(bundle);
    expect(ids).toContain(memberObject.stix.id);
    expect(ids).toContain(candidateWip.stix.id);
    expect(ids).toContain(candidateAwaitingReview.stix.id);
    expect(ids).toContain(candidateReviewed.stix.id);
    expect(ids).toContain(stagedObject.stix.id);
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle accepts singular tier names and repeated params', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=candidate&include=staged`,
    );

    const ids = bundleObjectIds(bundle);
    expect(ids).toContain(candidateWip.stix.id);
    expect(ids).toContain(stagedObject.stix.id);
  });

  it('state narrows included candidates but reviewed entries are always included', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=candidates&state=work-in-progress`,
    );

    const ids = bundleObjectIds(bundle);
    // Members are unaffected by state
    expect(ids).toContain(memberObject.stix.id);
    // Matching workflow status
    expect(ids).toContain(candidateWip.stix.id);
    // Reviewed entries are always included, irrespective of state
    expect(ids).toContain(candidateReviewed.stix.id);
    // Non-matching, non-reviewed status is excluded
    expect(ids).not.toContain(candidateAwaitingReview.stix.id);
  });

  it('state applies to the staged tier as well', async function () {
    // The staged object retained its work-in-progress status through promotion
    const withMatchingState = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=staged&state=work-in-progress`,
    );
    expect(bundleObjectIds(withMatchingState)).toContain(stagedObject.stix.id);

    const withoutMatchingState = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=staged&state=awaiting-review`,
    );
    expect(bundleObjectIds(withoutMatchingState)).not.toContain(stagedObject.stix.id);
  });

  it('GET /api/release-tracks/:id/snapshots/latest?format=bundle&stixVersion=2.0 conforms the bundle to STIX 2.0', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&stixVersion=2.0`,
    );

    expect(bundle.spec_version).toBe('2.0');
    const member = bundle.objects.find((o) => o.id === memberObject.stix.id);
    expect(member.spec_version).toBeUndefined();
  });

  it('rejects invalid include, state, and stixVersion values for bundle exports', async function () {
    await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=quarantine`,
      400,
    );
    await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&include=candidates&state=reviewed`,
      400,
    );
    await getBundle(
      `/api/release-tracks/${trackId}/snapshots/latest?format=bundle&stixVersion=3.0`,
      400,
    );
  });

  it('GET /api/release-tracks/:id/snapshots/:modified?format=bundle exports a historical snapshot', async function () {
    const bundle = await getBundle(
      `/api/release-tracks/${trackId}/snapshots/${snapshotModified}?format=bundle&include=candidates,staged`,
    );

    expect(bundle.type).toBe('bundle');
    expect(bundle.spec_version).toBeUndefined();
    expect(bundle.objects[0].type).toBe('x-mitre-collection');

    const ids = bundleObjectIds(bundle);
    expect(ids).toContain(memberObject.stix.id);
    expect(ids).toContain(candidateWip.stix.id);
    expect(ids).toContain(stagedObject.stix.id);
  });

  it('GET /api/release-tracks/:id/snapshots/latest (workbench default) is unaffected by bundle parameters', async function () {
    const snapshot = await getBundle(`/api/release-tracks/${trackId}/snapshots/latest`);
    expect(snapshot.members).toBeDefined();
    expect(snapshot.candidates).toBeDefined();
    expect(snapshot.staged).toBeDefined();
    expect(snapshot.type).toBe('standard');
  });

  after(async function () {
    await database.closeConnection();
  });
});
