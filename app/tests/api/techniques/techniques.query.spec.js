const fs = require('fs').promises;

const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');
const uuid = require('uuid');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory')

const techniquesService = require('../../../services/techniques-service');

function asyncWait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readJson(path) {
    const data = await fs.readFile(require.resolve(path));
    return JSON.parse(data);
}

async function configureTechniques(baseTechnique) {
    const techniques = [];
    // x_mitre_deprecated,revoked undefined
    const data1 = _.cloneDeep(baseTechnique);
    techniques.push(data1);

    // x_mitre_deprecated = false, revoked = false
    const data2 = _.cloneDeep(baseTechnique);
    data2.stix.x_mitre_deprecated = false;
    data2.stix.revoked = false;
    data2.workspace.workflow = { state: 'work-in-progress' };
    techniques.push(data2);

    // x_mitre_deprecated = true, revoked = false
    const data3 = _.cloneDeep(baseTechnique);
    data3.stix.x_mitre_deprecated = true;
    data3.stix.revoked = false;
    data3.workspace.workflow = { state: 'awaiting-review' };
    techniques.push(data3);

    // x_mitre_deprecated = false, revoked = true
    const data4 = _.cloneDeep(baseTechnique);
    data4.stix.x_mitre_deprecated = false;
    data4.stix.revoked = true;
    data4.workspace.workflow = { state: 'awaiting-review' };
    techniques.push(data4);

    // multiple versions, last version has x_mitre_deprecated = true, revoked = true
    const data5a = _.cloneDeep(baseTechnique);
    const id = `attack-pattern--${uuid.v4()}`;
    data5a.stix.id = id;
    data5a.stix.name = 'multiple-versions'
    data5a.workspace.workflow = { state: 'awaiting-review' };
    const createdTimestamp = new Date().toISOString();
    data5a.stix.created = createdTimestamp;
    data5a.stix.modified = createdTimestamp;
    techniques.push(data5a);

    await asyncWait(10); // wait so the modified timestamp can change
    const data5b = _.cloneDeep(baseTechnique);
    data5b.stix.id = id;
    data5b.stix.name = 'multiple-versions'
    data5b.workspace.workflow = { state: 'awaiting-review' };
    data5b.stix.created = createdTimestamp;
    let timestamp = new Date().toISOString();
    data5b.stix.modified = timestamp;
    techniques.push(data5b);

    await asyncWait(10);
    const data5c = _.cloneDeep(baseTechnique);
    data5c.stix.id = id;
    data5c.stix.name = 'multiple-versions'
    data5c.workspace.workflow = { state: 'awaiting-review' };
    data5c.stix.x_mitre_deprecated = true;
    data5c.stix.revoked = true;
    data5c.stix.created = createdTimestamp;
    timestamp = new Date().toISOString();
    data5c.stix.modified = timestamp;
    techniques.push(data5c);

//    logger.info(JSON.stringify(techniques, null, 4));

    return techniques;
}

async function loadTechniques(techniques) {
    for (const technique of techniques) {
        if (!technique.stix.name) {
            technique.stix.name = `attack-pattern-${technique.stix.x_mitre_deprecated}-${technique.stix.revoked}`;
        }

        if (!technique.stix.created) {
            const timestamp = new Date().toISOString();
            technique.stix.created = timestamp;
            technique.stix.modified = timestamp;
        }

        // eslint-disable-next-line no-await-in-loop
        await techniquesService.createAsync(technique);
    }
}

describe('Techniques Query API', function () {
    let app;

    before(async function() {
        // Initialize the express app
        app = await require('../../../index').initializeApp();

        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        const baseTechnique = await readJson('./techniques.query.json');
        const techniques = await configureTechniques(baseTechnique);
        await loadTechniques(techniques);
    });

    it('GET /api/techniques should return 2 of the preloaded techniques', function (done) {
        request(app)
            .get('/api/techniques')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with x_mitre_deprecated not set to true (false or undefined)', function (done) {
        request(app)
            .get('/api/techniques?includeDeprecated=false')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/techniques should return all techniques', function (done) {
        request(app)
            .get('/api/techniques?includeDeprecated=true')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with revoked not set to true (false or undefined)', function (done) {
        request(app)
            .get('/api/techniques?includeRevoked=false')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/techniques should return all techniques', function (done) {
        request(app)
            .get('/api/techniques?includeRevoked=true')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/techniques should return techniques with workflow.state set to work-in-progress', function (done) {
        request(app)
            .get('/api/techniques?state=work-in-progress')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the techniques
                    const techniques = res.body;
                    expect(techniques).toBeDefined();
                    expect(Array.isArray(techniques)).toBe(true);
                    expect(techniques.length).toBe(1);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

