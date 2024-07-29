const request = require('supertest');
const { expect } = require('expect');
const _ = require('lodash');

const logger = require('../../lib/logger');
logger.level = 'debug';

const database = require('../../lib/database-in-memory');
const databaseConfiguration = require('../../lib/database-configuration');

const login = require('./login');

class PaginationTests {
    constructor(service, initialObjectAData, options) {
        this.service = service;
        this.initialObjectData = initialObjectAData;

        this.options = {
            numberOfObjects: 45,
            prefix: options.prefix ?? 'test-object',
            baseUrl: options.baseUrl,
            label: options.label ?? 'TestObjects'
        };

        this.options.stateQuery = options.state ? `&state=${options.state}` : '';
    }
    async loadObjects() {
        // Initialize the data
        for (let i = 0; i < this.options.numberOfObjects; i++) {
            const data = _.cloneDeep(this.initialObjectData);
            data.stix.name = `${this.options.prefix}-${i}`;

            const timestamp = new Date();
            data.stix.created = timestamp.toISOString();
            data.stix.modified = timestamp.toISOString();

            try {
                await this.service.create(data, { import: false });
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    executeTests() {
        const self = this;

        describe(`${this.options.label} Pagination API`, function () {
            let app;
            let passportCookie;

            before(async function () {
                await database.initializeConnection();
                await databaseConfiguration.checkSystemConfiguration();
                app = await require('../../index').initializeApp();
                passportCookie = await login.loginAnonymous(app);
            });

            it(`GET ${self.options.baseUrl} return an empty page`, async function () {
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=0&limit=10${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(0);
            });

            it(`GET ${self.options.baseUrl} return an empty page with offset`, async function () {
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=10&limit=10${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(0);
            });

            it(`GET ${self.options.baseUrl} return an empty page with pagination data`, async function () {
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=0&limit=10&includePagination=true${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body.data;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(0);

                const pagination = response.body.pagination;
                expect(pagination).toBeDefined();
                expect(pagination.total).toBe(0);
                expect(pagination.limit).toBe(10);
                expect(pagination.offset).toBe(0);
            });

            it(`GET ${self.options.baseUrl} return an empty page with offset with pagination data`, async function () {
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=10&limit=10&includePagination=true${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body.data;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(0);

                const pagination = response.body.pagination;
                expect(pagination).toBeDefined();
                expect(pagination.total).toBe(0);
                expect(pagination.limit).toBe(10);
                expect(pagination.offset).toBe(10);
            });

            it(`GET ${self.options.baseUrl} returns the array of preloaded objects`, async function () {
                await self.loadObjects();
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=0${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(self.options.numberOfObjects);
            });

            const pageSizeList = [5, 10, 20];
            const offset = 10;
            pageSizeList.forEach((pageSize) => {
                it(`GET ${self.options.baseUrl} returns a page of preloaded objects`, async function () {
                    const response = await request(app)
                        .get(`${self.options.baseUrl}?offset=${offset}&limit=${pageSize}${self.options.stateQuery}`)
                        .set('Accept', 'application/json')
                        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                        .expect(200)
                        .expect('Content-Type', /json/);

                    const testObjects = response.body;
                    expect(testObjects).toBeDefined();
                    expect(Array.isArray(testObjects)).toBe(true);
                    expect(testObjects.length).toBe(pageSize);
                });

                it(`GET ${self.options.baseUrl} returns a page of preloaded objects with pagination data`, async function () {
                    const response = await request(app)
                        .get(`${self.options.baseUrl}?offset=${offset}&limit=${pageSize}&includePagination=true${self.options.stateQuery}`)
                        .set('Accept', 'application/json')
                        .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                        .expect(200)
                        .expect('Content-Type', /json/);

                    const testObjects = response.body.data;
                    expect(testObjects).toBeDefined();
                    expect(Array.isArray(testObjects)).toBe(true);
                    expect(testObjects.length).toBe(pageSize);

                    const pagination = response.body.pagination;
                    expect(pagination).toBeDefined();
                    expect(pagination.total).toBe(self.options.numberOfObjects);
                    expect(pagination.limit).toBe(pageSize);
                    expect(pagination.offset).toBe(offset);
                });
            });

            it(`GET ${self.options.baseUrl} return a partial page of preloaded objects`, async function () {
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=40&limit=20${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(5);
            });

            it(`GET ${self.options.baseUrl} return a partial page of preloaded objects with pagination data`, async function () {
                const response = await request(app)
                    .get(`${self.options.baseUrl}?offset=40&limit=20&includePagination=true${self.options.stateQuery}`)
                    .set('Accept', 'application/json')
                    .set('Cookie', `${login.passportCookieName}=${passportCookie.value}`)
                    .expect(200)
                    .expect('Content-Type', /json/);

                const testObjects = response.body.data;
                expect(testObjects).toBeDefined();
                expect(Array.isArray(testObjects)).toBe(true);
                expect(testObjects.length).toBe(5);

                const pagination = response.body.pagination;
                expect(pagination).toBeDefined();
                expect(pagination.total).toBe(45);
                expect(pagination.limit).toBe(20);
                expect(pagination.offset).toBe(40);
            });

            after(async function () {
                await database.closeConnection();
            });
        });
    }
}
module.exports = PaginationTests;


