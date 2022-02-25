const fs = require('fs').promises;

const request = require('supertest');
const expect = require('expect');
const _ = require('lodash');
const uuid = require('uuid');

const logger = require('../../../lib/logger');
logger.level = 'debug';

const database = require('../../../lib/database-in-memory');
const databaseConfiguration = require('../../../lib/database-configuration');

const groupsService = require('../../../services/groups-service');

function asyncWait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readJson(path) {
    const data = await fs.readFile(require.resolve(path));
    return JSON.parse(data);
}

async function configureGroups(baseGroup) {
    const groups = [];
    // x_mitre_deprecated,revoked undefined
    const data1 = _.cloneDeep(baseGroup);
    groups.push(data1);

    // x_mitre_deprecated = false, revoked = false
    const data2 = _.cloneDeep(baseGroup);
    data2.stix.x_mitre_deprecated = false;
    data2.stix.revoked = false;
    data2.workspace.workflow = { state: 'work-in-progress' };
    groups.push(data2);

    // x_mitre_deprecated = true, revoked = false
    const data3 = _.cloneDeep(baseGroup);
    data3.stix.x_mitre_deprecated = true;
    data3.stix.revoked = false;
    data3.workspace.workflow = { state: 'awaiting-review' };
    groups.push(data3);

    // x_mitre_deprecated = false, revoked = true
    const data4 = _.cloneDeep(baseGroup);
    data4.stix.x_mitre_deprecated = false;
    data4.stix.revoked = true;
    data4.workspace.workflow = { state: 'awaiting-review' };
    groups.push(data4);

    // multiple versions, last version has x_mitre_deprecated = true, revoked = true
    const data5a = _.cloneDeep(baseGroup);
    const id = `attack-pattern--${uuid.v4()}`;
    data5a.stix.id = id;
    data5a.stix.name = 'multiple-versions'
    data5a.workspace.workflow = { state: 'awaiting-review' };
    const createdTimestamp = new Date().toISOString();
    data5a.stix.created = createdTimestamp;
    data5a.stix.modified = createdTimestamp;
    groups.push(data5a);

    await asyncWait(10); // wait so the modified timestamp can change
    const data5b = _.cloneDeep(baseGroup);
    data5b.stix.id = id;
    data5b.stix.name = 'multiple-versions'
    data5b.workspace.workflow = { state: 'awaiting-review' };
    data5b.stix.created = createdTimestamp;
    let timestamp = new Date().toISOString();
    data5b.stix.modified = timestamp;
    groups.push(data5b);

    await asyncWait(10);
    const data5c = _.cloneDeep(baseGroup);
    data5c.stix.id = id;
    data5c.stix.name = 'multiple-versions'
    data5c.workspace.workflow = { state: 'awaiting-review' };
    data5c.stix.x_mitre_deprecated = true;
    data5c.stix.revoked = true;
    data5c.stix.created = createdTimestamp;
    timestamp = new Date().toISOString();
    data5c.stix.modified = timestamp;
    groups.push(data5c);

//    logger.info(JSON.stringify(groups, null, 4));

    return groups;
}

async function loadGroups(groups) {
    for (const group of groups) {
        if (!group.stix.name) {
            group.stix.name = `attack-pattern-${group.stix.x_mitre_deprecated}-${group.stix.revoked}`;
        }

        if (!group.stix.created) {
            const timestamp = new Date().toISOString();
            group.stix.created = timestamp;
            group.stix.modified = timestamp;
        }

        // eslint-disable-next-line no-await-in-loop
        await groupsService.create(group, { import: false });
    }
}

describe('Groups API Queries', function () {
    let app;

    before(async function() {
        // Establish the database connection
        // Use an in-memory database that we spin up for the test
        await database.initializeConnection();

        // Check for a valid database configuration
        await databaseConfiguration.checkSystemConfiguration();

        // Initialize the express app
        app = await require('../../../index').initializeApp();

        const baseGroup = await readJson('./groups.query.json');
        const groups = await configureGroups(baseGroup);
        await loadGroups(groups);
    });

    it('GET /api/groups should return 2 of the preloaded groups', function (done) {
        request(app)
            .get('/api/groups')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get both of the non-deprecated, non-revoked groups
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/groups should return groups with x_mitre_deprecated not set to true (false or undefined)', function (done) {
        request(app)
            .get('/api/groups?includeDeprecated=false')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get both of the non-deprecated, non-revoked groups
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/groups should return all groups', function (done) {
        request(app)
            .get('/api/groups?includeDeprecated=true')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the non-revoked groups
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/groups should return groups with revoked not set to true (false or undefined)', function (done) {
        request(app)
            .get('/api/groups?includeRevoked=false')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the non-revoked groups
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(2);
                    done();
                }
            });
    });

    it('GET /api/groups should return all groups', function (done) {
        request(app)
            .get('/api/groups?includeRevoked=true')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get all the non-deprecated groups
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(3);
                    done();
                }
            });
    });

    it('GET /api/groups should return groups with workflow.state set to work-in-progress', function (done) {
        request(app)
            .get('/api/groups?state=work-in-progress')
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    done(err);
                }
                else {
                    // We expect to get the group with the correct workflow.state
                    const groups = res.body;
                    expect(groups).toBeDefined();
                    expect(Array.isArray(groups)).toBe(true);
                    expect(groups.length).toBe(1);
                    done();
                }
            });
    });

    after(async function() {
        await database.closeConnection();
    });
});

