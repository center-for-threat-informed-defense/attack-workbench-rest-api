const request = require('supertest');
const { expect } = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const login = require('../../shared/login');

const logger = require('../../../lib/logger');
logger.level = 'debug';

// Test data for analytics with log source references
const analyticData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    name: 'test-analytic-with-refs',
    spec_version: '2.1',
    type: 'x-mitre-analytic',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'AN0001',
        url: 'https://attack.mitre.org/analytics/AN0001',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '3.3.0',
    x_mitre_platforms: ['windows'],
    x_mitre_domains: ['enterprise-attack'],
    x_mitre_log_sources: [
      {
        ref: 'x-mitre-log-source--test-log-source-1',
        keys: ['perm-1'],
      },
    ],
  },
};

// Test data for detection strategy that references an analytic
const detectionStrategyData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    name: 'test-detection-strategy',
    spec_version: '2.1',
    type: 'x-mitre-detection-strategy',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'DS0001',
        url: 'https://attack.mitre.org/datasources/DS0001',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '3.3.0',
    x_mitre_domains: ['enterprise-attack'],
    x_mitre_analytics: [], // Will be populated with analytic ID after creation
  },
};

// Test data for log source
const logSourceData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    id: 'x-mitre-log-source--test-log-source-1',
    name: 'test-log-source',
    spec_version: '2.1',
    type: 'x-mitre-log-source',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'LS0001',
        url: 'https://attack.mitre.org/logsources/LS0001',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '3.3.0',
  },
};

describe('Analytics API - includeRefs Parameter', function () {
  let app;
  let passportCookie;
  let createdAnalytic;
  let createdDetectionStrategy;
  let createdLogSource;

  before(async function () {
    // Establish the database connection
    await database.initializeConnection();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Initialize the express app
    app = await require('../../../index').initializeApp();

    // Log into the app
    passportCookie = await login.loginAnonymous(app);
  });

  it('Setup: Create log source for testing', async function () {
    const timestamp = new Date().toISOString();
    logSourceData.stix.created = timestamp;
    logSourceData.stix.modified = timestamp;

    const res = await request(app)
      .post('/api/log-sources')
      .send(logSourceData)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    createdLogSource = res.body;
    expect(createdLogSource).toBeDefined();
    expect(createdLogSource.stix.id).toBe('x-mitre-log-source--test-log-source-1');
  });

  it('Setup: Create analytic for testing', async function () {
    const timestamp = new Date().toISOString();
    analyticData.stix.created = timestamp;
    analyticData.stix.modified = timestamp;

    const res = await request(app)
      .post('/api/analytics')
      .send(analyticData)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    createdAnalytic = res.body;
    expect(createdAnalytic).toBeDefined();
    expect(createdAnalytic.stix.id).toBeDefined();
  });

  it('Setup: Create detection strategy that references the analytic', async function () {
    const timestamp = new Date().toISOString();
    detectionStrategyData.stix.created = timestamp;
    detectionStrategyData.stix.modified = timestamp;
    detectionStrategyData.stix.x_mitre_analytics = [createdAnalytic.stix.id];

    const res = await request(app)
      .post('/api/detection-strategies')
      .send(detectionStrategyData)
      .set('Accept', 'application/json')
      .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
      .expect(201)
      .expect('Content-Type', /json/);

    createdDetectionStrategy = res.body;
    expect(createdDetectionStrategy).toBeDefined();
    expect(createdDetectionStrategy.stix.id).toBeDefined();
    expect(createdDetectionStrategy.stix.x_mitre_analytics).toContain(createdAnalytic.stix.id);
  });

  describe('GET /api/analytics with includeRefs=false (default)', function () {
    it('should return analytics without related_to field', async function () {
      const res = await request(app)
        .get('/api/analytics')
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      const analytics = res.body;
      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBeGreaterThan(0);

      const testAnalytic = analytics.find((a) => a.stix.id === createdAnalytic.stix.id);
      expect(testAnalytic).toBeDefined();
      expect(testAnalytic.related_to).toBeUndefined();
    });
  });

  describe('GET /api/analytics with includeRefs=true', function () {
    it('should return analytics with related_to field containing detection strategies and log sources', async function () {
      const res = await request(app)
        .get('/api/analytics?includeRefs=true')
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      const analytics = res.body;
      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);

      const testAnalytic = analytics.find((a) => a.stix.id === createdAnalytic.stix.id);
      expect(testAnalytic).toBeDefined();
      expect(testAnalytic.related_to).toBeDefined();
      expect(Array.isArray(testAnalytic.related_to)).toBe(true);

      // Should contain the detection strategy
      const detectionStrategyRef = testAnalytic.related_to.find(
        (ref) => ref.type === 'x-mitre-detection-strategy',
      );
      expect(detectionStrategyRef).toBeDefined();
      expect(detectionStrategyRef.id).toBe(createdDetectionStrategy.stix.id);
      expect(detectionStrategyRef.name).toBe(createdDetectionStrategy.stix.name);
      expect(detectionStrategyRef.attack_id).toBe('DS0001');
      expect(detectionStrategyRef.type).toBe('x-mitre-detection-strategy');

      // Should contain the log source
      const logSourceRef = testAnalytic.related_to.find((ref) => ref.type === 'x-mitre-log-source');
      expect(logSourceRef).toBeDefined();
      expect(logSourceRef.id).toBe(createdLogSource.stix.id);
      expect(logSourceRef.name).toBe(createdLogSource.stix.name);
      expect(logSourceRef.attack_id).toBe('LS0001');
      expect(logSourceRef.type).toBe('x-mitre-log-source');
    });

    it('should work with pagination', async function () {
      const res = await request(app)
        .get('/api/analytics?includeRefs=true&includePagination=true&limit=10')
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      const result = res.body;
      expect(result).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      const testAnalytic = result.data.find((a) => a.stix.id === createdAnalytic.stix.id);
      if (testAnalytic) {
        expect(testAnalytic.related_to).toBeDefined();
        expect(Array.isArray(testAnalytic.related_to)).toBe(true);
      }
    });
  });

  describe('GET /api/analytics/:id with includeRefs parameter', function () {
    it('should return analytic without related_to when includeRefs=false', async function () {
      const res = await request(app)
        .get(`/api/analytics/${createdAnalytic.stix.id}?includeRefs=false`)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      const analytics = res.body;
      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBe(1);

      const analytic = analytics[0];
      expect(analytic.related_to).toBeUndefined();
    });

    it('should return analytic with related_to when includeRefs=true', async function () {
      const res = await request(app)
        .get(`/api/analytics/${createdAnalytic.stix.id}?includeRefs=true`)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      const analytics = res.body;
      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBe(1);

      const analytic = analytics[0];
      expect(analytic.related_to).toBeDefined();
      expect(Array.isArray(analytic.related_to)).toBe(true);
      expect(analytic.related_to.length).toBe(2); // detection strategy + log source

      // Verify detection strategy reference
      const detectionStrategyRef = analytic.related_to.find(
        (ref) => ref.type === 'x-mitre-detection-strategy',
      );
      expect(detectionStrategyRef).toBeDefined();
      expect(detectionStrategyRef.id).toBe(createdDetectionStrategy.stix.id);
      expect(detectionStrategyRef.name).toBe(createdDetectionStrategy.stix.name);

      // Verify log source reference
      const logSourceRef = analytic.related_to.find((ref) => ref.type === 'x-mitre-log-source');
      expect(logSourceRef).toBeDefined();
      expect(logSourceRef.id).toBe(createdLogSource.stix.id);
      expect(logSourceRef.name).toBe(createdLogSource.stix.name);
    });

    it('should work with versions=all parameter', async function () {
      const res = await request(app)
        .get(`/api/analytics/${createdAnalytic.stix.id}?versions=all&includeRefs=true`)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      const analytics = res.body;
      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBeGreaterThanOrEqual(1);

      // All versions should have related_to populated
      analytics.forEach((analytic) => {
        expect(analytic.related_to).toBeDefined();
        expect(Array.isArray(analytic.related_to)).toBe(true);
      });
    });
  });

  describe('Edge cases and error handling', function () {
    it('should handle analytics with no log source references', async function () {
      // Create an analytic without log source references
      const analyticWithoutRefs = {
        ...analyticData,
        stix: {
          ...analyticData.stix,
          name: 'analytic-without-refs',
          x_mitre_log_sources: [],
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };

      const createRes = await request(app)
        .post('/api/analytics')
        .send(analyticWithoutRefs)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(201);

      const createdAnalyticWithoutRefs = createRes.body;

      const res = await request(app)
        .get(`/api/analytics/${createdAnalyticWithoutRefs.stix.id}?includeRefs=true`)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200);

      const analytics = res.body;
      const analytic = analytics[0];
      expect(analytic.related_to).toBeDefined();
      expect(Array.isArray(analytic.related_to)).toBe(true);
      // Should only contain detection strategies that reference it, no log sources
      const logSourceRefs = analytic.related_to.filter((ref) => ref.type === 'x-mitre-log-source');
      expect(logSourceRefs.length).toBe(0);
    });

    it('should handle non-existent log source references gracefully', async function () {
      // Create an analytic with a non-existent log source reference
      const analyticWithBadRef = {
        ...analyticData,
        stix: {
          ...analyticData.stix,
          name: 'analytic-with-bad-ref',
          x_mitre_log_sources: [
            {
              ref: 'x-mitre-log-source--non-existent',
              keys: ['perm-1'],
            },
          ],
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };

      const createRes = await request(app)
        .post('/api/analytics')
        .send(analyticWithBadRef)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(201);

      const createdAnalyticWithBadRef = createRes.body;

      const res = await request(app)
        .get(`/api/analytics/${createdAnalyticWithBadRef.stix.id}?includeRefs=true`)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200);

      const analytics = res.body;
      const analytic = analytics[0];
      expect(analytic.related_to).toBeDefined();
      expect(Array.isArray(analytic.related_to)).toBe(true);
      // Should not contain the non-existent log source
      const logSourceRefs = analytic.related_to.filter((ref) => ref.type === 'x-mitre-log-source');
      expect(logSourceRefs.length).toBe(0);
    });

    it('should handle analytics with missing external references', async function () {
      // Create objects without external references
      const logSourceWithoutExtRefs = {
        ...logSourceData,
        stix: {
          ...logSourceData.stix,
          id: 'x-mitre-log-source--no-ext-refs',
          name: 'log-source-no-ext-refs',
          external_references: [],
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };

      await request(app)
        .post('/api/log-sources')
        .send(logSourceWithoutExtRefs)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(201);

      const analyticWithNoExtRefLogSource = {
        ...analyticData,
        stix: {
          ...analyticData.stix,
          name: 'analytic-with-no-ext-ref-log-source',
          x_mitre_log_sources: [
            {
              ref: 'x-mitre-log-source--no-ext-refs',
              keys: ['perm-1'],
            },
          ],
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };

      const createRes = await request(app)
        .post('/api/analytics')
        .send(analyticWithNoExtRefLogSource)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(201);

      const createdAnalyticWithNoExtRefLogSource = createRes.body;

      const res = await request(app)
        .get(`/api/analytics/${createdAnalyticWithNoExtRefLogSource.stix.id}?includeRefs=true`)
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200);

      const analytics = res.body;
      const analytic = analytics[0];
      const logSourceRef = analytic.related_to.find((ref) => ref.type === 'x-mitre-log-source');
      expect(logSourceRef).toBeDefined();
      expect(logSourceRef.attack_id).toBeNull();
    });
  });

  after(async function () {
    await database.closeConnection();
  });
});
