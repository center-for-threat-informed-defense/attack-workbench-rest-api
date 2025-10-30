const request = require('supertest');
const { expect } = require('expect');

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');
const AttackObject = require('../../../models/attack-object-model');
const config = require('../../../config/config');
const login = require('../../shared/login');
const tacticsService = require('../../../services/tactics-service');
const techniquesService = require('../../../services/techniques-service');
const groupsService = require('../../../services/groups-service');

const logger = require('../../../lib/logger');
logger.level = 'debug';

describe('ATT&CK ID Generation API', function () {
  let app;
  let passportCookie;

  before(async function () {
    // Establish the database connection
    await database.initializeConnection();

    // Wait until the indexes are created
    await AttackObject.init();

    // Check for a valid database configuration
    await databaseConfiguration.checkSystemConfiguration();

    // Disable ADM validation for tests
    config.validateRequests.withAttackDataModel = false;
    config.validateRequests.withOpenApi = true;

    // Initialize the express app
    app = await require('../../../index').initializeApp();

    // Log into the app
    passportCookie = await login.loginAnonymous(app);
  });

  describe('GET /api/attack-objects/attack-id/next', function () {
    it('should return 400 when type parameter is missing', async function () {
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(400);

      // OpenAPI validator catches this before controller
      expect(res.text).toContain("must have required property 'type'");
    });

    it('should return 400 for unsupported STIX type', async function () {
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'marking-definition' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(400);

      // OpenAPI validator validates enum values
      expect(res.text).toContain('must be equal to one of the allowed values');
    });

    it('should generate TA0001 for first tactic when database is empty', async function () {
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'x-mitre-tactic' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('attack_id');
      expect(res.body.attack_id).toBe('TA0001');
    });

    it('should generate T0001 for first technique when database is empty', async function () {
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'attack-pattern' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('attack_id');
      expect(res.body.attack_id).toBe('T0001');
    });

    it('should generate G0001 for first group when database is empty', async function () {
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'intrusion-set' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('attack_id');
      expect(res.body.attack_id).toBe('G0001');
    });

    it('should generate sequential IDs after creating objects', async function () {
      // Create a tactic with TA0001
      const tactic = {
        workspace: {
          attack_id: 'TA0001',
          workflow: { state: 'work-in-progress' },
        },
        stix: {
          name: 'Test Tactic',
          type: 'x-mitre-tactic',
          spec_version: '2.1',
          x_mitre_shortname: 'test-tactic',
          description: 'A test tactic',
          created: '2023-01-01T00:00:00.000Z',
          modified: '2023-01-01T00:00:00.000Z',
          x_mitre_domains: ['enterprise-attack'],
        },
      };
      await tacticsService.create(tactic);

      // Request next tactic ID
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'x-mitre-tactic' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body.attack_id).toBe('TA0002');
    });

    it('should handle gaps in ID sequence correctly', async function () {
      // Create tactics with TA0002 and TA0005 (skipping TA0003 and TA0004)
      const tactic2 = {
        workspace: {
          attack_id: 'TA0002',
          workflow: { state: 'work-in-progress' },
        },
        stix: {
          name: 'Test Tactic 2',
          type: 'x-mitre-tactic',
          spec_version: '2.1',
          x_mitre_shortname: 'test-tactic-2',
          description: 'A test tactic 2',
          created: '2023-01-02T00:00:00.000Z',
          modified: '2023-01-02T00:00:00.000Z',
          x_mitre_domains: ['enterprise-attack'],
        },
      };
      await tacticsService.create(tactic2);

      const tactic5 = {
        workspace: {
          attack_id: 'TA0005',
          workflow: { state: 'work-in-progress' },
        },
        stix: {
          name: 'Test Tactic 5',
          type: 'x-mitre-tactic',
          spec_version: '2.1',
          x_mitre_shortname: 'test-tactic-5',
          description: 'A test tactic 5',
          created: '2023-01-05T00:00:00.000Z',
          modified: '2023-01-05T00:00:00.000Z',
          x_mitre_domains: ['enterprise-attack'],
        },
      };
      await tacticsService.create(tactic5);

      // Next ID should be TA0006 (max + 1)
      const res = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'x-mitre-tactic' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body.attack_id).toBe('TA0006');
    });

    it('should handle multiple types independently', async function () {
      // Create a technique with T0001
      const technique = {
        workspace: {
          attack_id: 'T0001',
          workflow: { state: 'work-in-progress' },
        },
        stix: {
          name: 'Test Technique',
          type: 'attack-pattern',
          spec_version: '2.1',
          description: 'A test technique',
          created: '2023-01-01T00:00:00.000Z',
          modified: '2023-01-01T00:00:00.000Z',
          x_mitre_domains: ['enterprise-attack'],
          x_mitre_is_subtechnique: false,
        },
      };
      await techniquesService.create(technique);

      // Create a group with G0001
      const group = {
        workspace: {
          attack_id: 'G0001',
          workflow: { state: 'work-in-progress' },
        },
        stix: {
          name: 'Test Group',
          type: 'intrusion-set',
          spec_version: '2.1',
          description: 'A test group',
          created: '2023-01-01T00:00:00.000Z',
          modified: '2023-01-01T00:00:00.000Z',
        },
      };
      await groupsService.create(group);

      // Check that technique counter is T0002
      const techRes = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'attack-pattern' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200);

      expect(techRes.body.attack_id).toBe('T0002');

      // Check that group counter is G0002
      const groupRes = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'intrusion-set' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200);

      expect(groupRes.body.attack_id).toBe('G0002');

      // Check that tactic counter is still TA0006 (from previous test)
      const tacticRes = await request(app)
        .get('/api/attack-objects/attack-id/next')
        .query({ type: 'x-mitre-tactic' })
        .set('Accept', 'application/json')
        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
        .expect(200);

      expect(tacticRes.body.attack_id).toBe('TA0006');
    });

    it('should generate IDs for all supported STIX types', async function () {
      const typeToExpectedPrefix = {
        'x-mitre-tactic': 'TA',
        'attack-pattern': 'T',
        'intrusion-set': 'G',
        malware: 'S',
        tool: 'S',
        'course-of-action': 'M',
        'x-mitre-data-source': 'DS',
        'x-mitre-data-component': 'DC',
        'x-mitre-asset': 'A',
        campaign: 'C',
        'x-mitre-detection-strategy': 'DET',
        'x-mitre-analytic': 'AN',
      };

      for (const [stixType, prefix] of Object.entries(typeToExpectedPrefix)) {
        const res = await request(app)
          .get('/api/attack-objects/attack-id/next')
          .query({ type: stixType })
          .set('Accept', 'application/json')
          .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
          .expect(200);

        expect(res.body.attack_id).toMatch(new RegExp(`^${prefix}`));
        logger.debug(`${stixType} -> ${res.body.attack_id}`);
      }
    });
  });

  after(async function () {
    await database.closeConnection();
  });
});
