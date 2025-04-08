'use strict';

const { expect } = require('expect');
const sinon = require('sinon');

const database = require('../../../lib/database-in-memory');
const BaseRepository = require('../../../repository/_base.repository');
const {
  DatabaseError,
  DuplicateIdError,
  BadlyFormattedParameterError,
  MissingParameterError,
} = require('../../../exceptions');

// Test model schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testStixSchema = new Schema({
  id: String,
  type: String,
  name: String,
  description: String,
  modified: Date,
  revoked: Boolean,
  x_mitre_deprecated: Boolean,
  x_mitre_domains: [String],
  x_mitre_platforms: [String],
});

const testWorkspaceSchema = new Schema({
  attack_id: String,
  workflow: {
    state: String,
    created_by_user_account: String,
  },
});

const testObjectSchema = new Schema({
  stix: testStixSchema,
  workspace: testWorkspaceSchema,
});

// Add the same unique index that exists in the real model
testObjectSchema.index({ 'stix.id': 1, 'stix.modified': -1 }, { unique: true });

describe('BaseRepository', function () {
  // Set higher timeout for all tests
  this.timeout(10000);
  let TestModel;
  let testRepo;
  // Sample test data
  const testDocs = [
    {
      stix: {
        id: 'test--001',
        type: 'test-type',
        name: 'Test Object 1',
        description: 'Test description 1',
        modified: new Date('2023-01-01'),
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_platforms: ['windows'],
      },
      workspace: {
        attack_id: 'T0001',
        workflow: {
          state: 'work-in-progress',
          created_by_user_account: 'user1',
        },
      },
    },
    {
      stix: {
        id: 'test--002',
        type: 'test-type',
        name: 'Test Object 2',
        description: 'Test description 2',
        modified: new Date('2023-01-02'),
        x_mitre_domains: ['mobile-attack'],
        x_mitre_platforms: ['android'],
      },
      workspace: {
        attack_id: 'T0002',
        workflow: {
          state: 'awaiting-review',
          created_by_user_account: 'user2',
        },
      },
    },
    {
      stix: {
        id: 'test--001', // Same ID as first object but newer version
        type: 'test-type',
        name: 'Test Object 1 Updated',
        description: 'Updated description',
        modified: new Date('2023-01-15'),
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_platforms: ['windows', 'macos'],
      },
      workspace: {
        attack_id: 'T0001',
        workflow: {
          state: 'awaiting-review',
          created_by_user_account: 'user1',
        },
      },
    },
    {
      stix: {
        id: 'test--003',
        type: 'test-type',
        name: 'Test Object 3',
        description: 'Revoked object',
        modified: new Date('2023-01-03'),
        revoked: true,
        x_mitre_domains: ['enterprise-attack'],
        x_mitre_platforms: ['linux'],
      },
      workspace: {
        attack_id: 'T0003',
        workflow: {
          state: 'validated',
          created_by_user_account: 'user3',
        },
      },
    },
    {
      stix: {
        id: 'test--004',
        type: 'test-type',
        name: 'Test Object 4',
        description: 'Deprecated object',
        modified: new Date('2023-01-04'),
        x_mitre_deprecated: true,
        x_mitre_domains: ['ics-attack'],
        x_mitre_platforms: ['ics'],
      },
      workspace: {
        attack_id: 'T0004',
        workflow: {
          state: 'archived',
          created_by_user_account: 'user4',
        },
      },
    },
  ];

  before(async function () {
    // Increase timeout for this hook to avoid timeouts
    this.timeout(10000);

    // Initialize in-memory database connection
    await database.initializeConnection();

    try {
      // Create the test model (with overwrite option if it exists)
      TestModel = mongoose.models.TestObject || mongoose.model('TestObject', testObjectSchema);

      // Wait for indexes to be built
      await TestModel.init();

      // Initialize repository with our test model
      testRepo = new BaseRepository(TestModel);

      // Clear any existing data
      await TestModel.deleteMany({});

      // Insert test data
      await TestModel.insertMany(testDocs);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  after(async function () {
    // Close the database connection and clean up
    await database.closeConnection();
  });

  describe('retrieveAll', function () {
    it('should retrieve all documents with default options', async function () {
      const options = {};
      const result = await testRepo.retrieveAll(options);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1); // The faceted result

      const facet = result[0];
      expect(facet.totalCount).toBeDefined();
      expect(facet.documents).toBeDefined();

      // Should exclude revoked and deprecated objects by default
      // Only 2 objects in our test data are neither revoked nor deprecated
      expect(facet.documents.length).toBe(2);

      // Check that we get latest versions only
      const testObj1 = facet.documents.find((d) => d.stix.id === 'test--001');
      expect(testObj1).toBeDefined();
      expect(testObj1.stix.name).toBe('Test Object 1 Updated');
    });

    it('should include revoked objects when specified', async function () {
      const options = { includeRevoked: true };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(3); // Now includes the revoked object

      const revokedObj = facet.documents.find((d) => d.stix.revoked === true);
      expect(revokedObj).toBeDefined();
      expect(revokedObj.stix.id).toBe('test--003');
    });

    it('should include deprecated objects when specified', async function () {
      const options = { includeDeprecated: true };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(3); // Now includes the deprecated object

      const deprecatedObj = facet.documents.find((d) => d.stix.x_mitre_deprecated === true);
      expect(deprecatedObj).toBeDefined();
      expect(deprecatedObj.stix.id).toBe('test--004');
    });

    it('should filter by state', async function () {
      const options = { state: 'awaiting-review' };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(2);

      facet.documents.forEach((doc) => {
        expect(doc.workspace.workflow.state).toBe('awaiting-review');
      });
    });

    it('should filter by multiple states when array is provided', async function () {
      const options = { state: ['awaiting-review', 'validated'] };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(2); // 'validated' state is on a revoked object

      facet.documents.forEach((doc) => {
        expect(['awaiting-review', 'validated']).toContain(doc.workspace.workflow.state);
      });
    });

    it('should filter by domain', async function () {
      const options = { domain: 'mobile-attack' };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1);
      expect(facet.documents[0].stix.x_mitre_domains).toContain('mobile-attack');
    });

    it('should filter by multiple domains when array is provided', async function () {
      const options = { domain: ['mobile-attack', 'ics-attack'] };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1); // Only mobile-attack is not revoked or deprecated
    });

    it('should filter by platform', async function () {
      const options = { platform: 'windows' };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1);
      expect(facet.documents[0].stix.x_mitre_platforms).toContain('windows');
    });

    it('should filter by multiple platforms when array is provided', async function () {
      const options = { platform: ['windows', 'macos'] };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1);
    });

    it('should filter by lastUpdatedBy', async function () {
      const options = { lastUpdatedBy: 'user1' };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1);
      expect(facet.documents[0].workspace.workflow.created_by_user_account).toBe('user1');
    });

    it('should handle search parameter', async function () {
      const options = { search: 'Updated' };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1);
      expect(facet.documents[0].stix.description).toContain('Updated');
    });

    it('should handle pagination with offset and limit', async function () {
      const options = { offset: 1, limit: 1 };
      const result = await testRepo.retrieveAll(options);

      const facet = result[0];
      expect(facet.documents.length).toBe(1);
      expect(facet.totalCount[0].totalCount).toBe(2); // Total count should be 2 (non-revoked, non-deprecated)
    });

    it('should handle database errors gracefully', async function () {
      // Mock the aggregate function to throw an error
      const originalAggregate = TestModel.aggregate;
      TestModel.aggregate = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.retrieveAll({});
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.aggregate = originalAggregate;
      }
    });
  });

  describe('retrieveAllByDomain', function () {
    it('should throw MissingParameterError when domain is not provided', async function () {
      try {
        await testRepo.retrieveAllByDomain(null, {});
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        // In _base.repository.js, retrieveAllByDomain wraps all errors in DatabaseError
        expect(err).toBeInstanceOf(MissingParameterError);
        // The original error is stored in the 'cause' property
        expect(err.message).toContain('Missing required parameter: domain');
      }
    });

    it('should retrieve documents by domain', async function () {
      const options = {};
      const result = await testRepo.retrieveAllByDomain('enterprise-attack', options);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1); // Only the non-revoked, non-deprecated enterprise-attack object
    });

    it('should include revoked objects when specified', async function () {
      const options = { includeRevoked: true };
      const result = await testRepo.retrieveAllByDomain('enterprise-attack', options);

      expect(result.length).toBe(2); // Now includes the revoked object
    });

    it('should handle database errors gracefully', async function () {
      // Mock the aggregate function to throw an error
      const originalAggregate = TestModel.aggregate;
      TestModel.aggregate = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.retrieveAllByDomain('enterprise-attack', {});
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.aggregate = originalAggregate;
      }
    });
  });

  describe('retrieveOneById', function () {
    it('should retrieve one document by STIX ID', async function () {
      const result = await testRepo.retrieveOneById('test--001');

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--001');
    });

    it('should return null for non-existent STIX ID', async function () {
      const result = await testRepo.retrieveOneById('test--nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async function () {
      // Mock the findOne function to throw an error
      const originalFindOne = TestModel.findOne;
      TestModel.findOne = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.retrieveOneById('test--001');
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.findOne = originalFindOne;
      }
    });
  });

  describe('retrieveAllById', function () {
    it('should retrieve all versions of a document by STIX ID', async function () {
      const result = await testRepo.retrieveAllById('test--001');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach((doc) => {
        expect(doc.stix.id).toBe('test--001');
      });
    });

    it('should return empty array for non-existent STIX ID', async function () {
      const result = await testRepo.retrieveAllById('test--nonexistent');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle database errors gracefully', async function () {
      // Mock the find function to throw an error
      const originalFind = TestModel.find;
      TestModel.find = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.retrieveAllById('test--001');
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.find = originalFind;
      }
    });
  });

  describe('retrieveLatestByStixId', function () {
    it('should retrieve the latest version of a document by STIX ID', async function () {
      const result = await testRepo.retrieveLatestByStixId('test--001');

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--001');
      expect(result.stix.name).toBe('Test Object 1 Updated');
      expect(result.stix.modified).toEqual(new Date('2023-01-15'));
    });

    it('should return null for non-existent STIX ID', async function () {
      const result = await testRepo.retrieveLatestByStixId('test--nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async function () {
      // Mock the findOne function to throw an error
      const originalFindOne = TestModel.findOne;
      TestModel.findOne = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.retrieveLatestByStixId('test--001');
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.findOne = originalFindOne;
      }
    });
  });

  describe('retrieveOneByVersion', function () {
    it('should retrieve a specific version of a document', async function () {
      const result = await testRepo.retrieveOneByVersion('test--001', new Date('2023-01-01'));

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--001');
      expect(result.stix.name).toBe('Test Object 1');
      expect(result.stix.modified).toEqual(new Date('2023-01-01'));
    });

    it('should return null for non-existent version', async function () {
      const result = await testRepo.retrieveOneByVersion('test--001', new Date('2022-01-01'));

      expect(result).toBeNull();
    });

    it('should handle CastError as BadlyFormattedParameterError', async function () {
      // Mock the findOne function to throw a CastError
      const originalFindOne = TestModel.findOne;
      const castError = new Error('Cast Error');
      castError.name = 'CastError';

      TestModel.findOne = () => {
        throw castError;
      };

      try {
        await testRepo.retrieveOneByVersion('invalid-id', new Date());
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(BadlyFormattedParameterError);
      } finally {
        // Restore the original function
        TestModel.findOne = originalFindOne;
      }
    });

    it('should handle MongoDB duplicate key error as DuplicateIdError', async function () {
      // Mock the findOne function to throw a MongoServerError
      const originalFindOne = TestModel.findOne;
      const dupeError = new Error('Duplicate key error');
      dupeError.name = 'MongoServerError';
      dupeError.code = 11000;

      TestModel.findOne = () => {
        throw dupeError;
      };

      try {
        await testRepo.retrieveOneByVersion('test--001', new Date());
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DuplicateIdError);
      } finally {
        // Restore the original function
        TestModel.findOne = originalFindOne;
      }
    });
  });

  describe('createNewDocument', function () {
    it('should create a new document without saving', function () {
      const data = {
        stix: {
          id: 'test--new',
          type: 'test-type',
          name: 'New Test Object',
          modified: new Date(),
        },
      };

      const result = testRepo.createNewDocument(data);

      expect(result).toBeDefined();
      expect(result instanceof TestModel).toBe(true);
      expect(result.stix.id).toBe('test--new');
      expect(result.isNew).toBe(true); // Mongoose flag indicating not saved
    });
  });

  describe('saveDocument', function () {
    it('should save a document and return it', async function () {
      const data = {
        stix: {
          id: 'test--save',
          type: 'test-type',
          name: 'Save Test Object',
          modified: new Date(),
        },
      };

      const doc = testRepo.createNewDocument(data);
      const result = await testRepo.saveDocument(doc);

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--save');
      expect(result.isNew).toBe(false); // Now saved

      // Verify it's in the database
      const fromDb = await TestModel.findOne({ 'stix.id': 'test--save' });
      expect(fromDb).toBeDefined();
      expect(fromDb.stix.id).toBe('test--save');
    });

    it('should handle MongoDB duplicate key error as DuplicateIdError', async function () {
      const doc = testRepo.createNewDocument({
        stix: {
          id: 'test--001',
          type: 'test-type',
          name: 'Duplicate Test Object',
          modified: new Date('2023-01-01'), // This exact version already exists
        },
      });

      // Create a stub that simulates the duplicate key error
      const saveStub = sinon.stub(doc, 'save');
      const dupeError = new Error('Duplicate key error');
      dupeError.name = 'MongoServerError';
      dupeError.code = 11000;
      saveStub.throws(dupeError);

      try {
        await testRepo.saveDocument(doc);
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DuplicateIdError);
        expect(err.details).toContain('test--001');
      } finally {
        saveStub.restore();
      }
    });

    it('should handle other errors as DatabaseError', async function () {
      const doc = testRepo.createNewDocument({
        stix: {
          id: 'test--error',
          type: 'test-type',
          name: 'Error Test Object',
          modified: new Date(),
        },
      });

      // Create a stub that simulates a generic error
      const saveStub = sinon.stub(doc, 'save');
      saveStub.throws(new Error('Generic error'));

      try {
        await testRepo.saveDocument(doc);
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        saveStub.restore();
      }
    });
  });

  describe('save', function () {
    it('should create and save a document in one step', async function () {
      const data = {
        stix: {
          id: 'test--save2',
          type: 'test-type',
          name: 'Save2 Test Object',
          modified: new Date(),
        },
      };

      const result = await testRepo.save(data);

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--save2');

      // Verify it's in the database
      const fromDb = await TestModel.findOne({ 'stix.id': 'test--save2' });
      expect(fromDb).toBeDefined();
      expect(fromDb.stix.id).toBe('test--save2');
    });

    it('should handle MongoDB duplicate key error as DuplicateIdError', async function () {
      // Create a document to insert first
      const existingData = {
        stix: {
          id: 'test--dupe',
          type: 'test-type',
          name: 'Original',
          modified: new Date('2023-01-10'),
        },
      };
      await testRepo.save(existingData);

      // Now create a document with the exact same ID and modified date to cause duplicate key error
      try {
        // const duplicateData = JSON.parse(JSON.stringify(existingData));
        await testRepo.save(existingData);
        // If we get here, the test failed
        expect('Should have thrown duplicate error').toBe(true);
      } catch (err) {
        expect(err instanceof DuplicateIdError).toBe(true);
        expect(err.details).toContain('test--dupe');
      }
    });

    it('should handle other errors as DatabaseError', async function () {
      // Mock save to throw an error directly instead of trying to modify the constructor
      const originalSave = TestModel.prototype.save;
      TestModel.prototype.save = function () {
        throw new Error('Model error');
      };

      try {
        await testRepo.save({
          stix: {
            id: 'test--error2',
            type: 'test-type',
            name: 'Error2 Test Object',
            modified: new Date(),
          },
        });
        // Should not reach here
        expect('Should have thrown an error').toBe(true);
      } catch (err) {
        expect(err instanceof DatabaseError).toBe(true);
      } finally {
        // Restore the original save method
        TestModel.prototype.save = originalSave;
      }
    });
  });

  describe('updateAndSave', function () {
    it('should update an existing document and save it', async function () {
      // First retrieve a document
      const original = await testRepo.retrieveOneById('test--001');

      // Update it
      const updates = {
        stix: {
          name: 'Updated via updateAndSave',
          description: 'This was updated using updateAndSave',
        },
      };

      const result = await testRepo.updateAndSave(original, updates);

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--001');
      expect(result.stix.name).toBe('Updated via updateAndSave');
      expect(result.stix.description).toBe('This was updated using updateAndSave');

      // Verify the update was saved to database
      const fromDb = await TestModel.findOne({
        'stix.id': 'test--001',
        'stix.name': 'Updated via updateAndSave',
      });
      expect(fromDb).toBeDefined();
    });

    it('should handle database errors gracefully', async function () {
      // First retrieve a document
      const original = await testRepo.retrieveOneById('test--002');

      // Create a stub that simulates an error during save
      const saveStub = sinon.stub(original, 'save');
      saveStub.throws(new Error('Save error'));

      try {
        await testRepo.updateAndSave(original, { stix: { name: 'Error Test' } });
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        saveStub.restore();
      }
    });
  });

  describe('findOneAndDelete', function () {
    it('should delete a specific version of a document', async function () {
      // First, create a document with a specific modified date
      const data = {
        stix: {
          id: 'test--delete',
          type: 'test-type',
          name: 'Delete Test Object',
          modified: new Date('2023-01-10'),
        },
      };
      await testRepo.save(data);

      // Now delete it
      const result = await testRepo.findOneAndDelete('test--delete', new Date('2023-01-10'));

      expect(result).toBeDefined();
      expect(result.stix.id).toBe('test--delete');

      // Verify it's gone from the database
      const fromDb = await TestModel.findOne({
        'stix.id': 'test--delete',
        'stix.modified': new Date('2023-01-10'),
      });
      expect(fromDb).toBeNull();
    });

    it('should return null if document does not exist', async function () {
      const result = await testRepo.findOneAndDelete('test--nonexistent', new Date());

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async function () {
      // Mock the findOneAndDelete function to throw an error
      const originalFindOneAndDelete = TestModel.findOneAndDelete;
      TestModel.findOneAndDelete = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.findOneAndDelete('test--001', new Date());
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.findOneAndDelete = originalFindOneAndDelete;
      }
    });
  });

  describe('deleteMany', function () {
    it('should delete all versions of a document', async function () {
      // First, create multiple versions of a document
      const data1 = {
        stix: {
          id: 'test--delete-many',
          type: 'test-type',
          name: 'Delete Many Test Object 1',
          modified: new Date('2023-01-11'),
        },
      };
      await testRepo.save(data1);

      const data2 = {
        stix: {
          id: 'test--delete-many',
          type: 'test-type',
          name: 'Delete Many Test Object 2',
          modified: new Date('2023-01-12'),
        },
      };
      await testRepo.save(data2);

      // Now delete all versions
      const result = await testRepo.deleteMany('test--delete-many');

      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(2);

      // Verify they're gone from the database
      const fromDb = await TestModel.find({ 'stix.id': 'test--delete-many' });
      expect(fromDb).toBeDefined();
      expect(fromDb.length).toBe(0);
    });

    it('should handle database errors gracefully', async function () {
      // Mock the deleteMany function to throw an error
      const originalDeleteMany = TestModel.deleteMany;
      TestModel.deleteMany = () => {
        throw new Error('Database error');
      };

      try {
        await testRepo.deleteMany('test--001');
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseError);
      } finally {
        // Restore the original function
        TestModel.deleteMany = originalDeleteMany;
      }
    });
  });
});
