'use strict';

const attackObjectsRepository = require('../repository/attack-objects-repository');
const BaseService = require('./_base.service');
const identitiesService = require('./identities-service');
const relationshipsService = require('./relationships-service');
const logger = require('../lib/logger');
const { NotImplementedError, DatabaseError } = require('../exceptions');

class AttackObjectsService extends BaseService {
  /**
   * Override of base class retrieveAll() because:
   * 1. Adds special handling for relationships
   * 2. Uses custom pagination logic
   */
  async retrieveAll(options) {
    // Get attack objects from repository
    const results = await this.repository.retrieveAll(options);
    let documents = results[0].documents;

    // Add relationships from separate collection if not filtering by attackId or search
    if (!options.attackId && !options.search) {
      const relationshipsOptions = {
        includeRevoked: options.includeRevoked,
        includeDeprecated: options.includeDeprecated,
        state: options.state,
        versions: options.versions,
        lookupRefs: false,
        includeIdentities: false,
        lastUpdatedBy: options.lastUpdatedBy,
      };
      const relationships = await relationshipsService.retrieveAll(relationshipsOptions);
      documents = documents.concat(relationships);
    }

    // Add identities
    await identitiesService.addCreatedByAndModifiedByIdentitiesToAll(documents);

    // Handle pagination
    if (options.includePagination) {
      return {
        pagination: {
          total: results[0].totalCount[0]?.totalCount || 0,
          offset: options.offset,
          limit: options.limit,
        },
        data: documents,
      };
    }
    return documents;
  }

  /**
   * Override of base class retrieveVersionById() because:
   * 1. Adds special handling for relationships
   */
  async retrieveVersionById(stixId, modified) {
    // Handle relationships separately
    if (stixId.startsWith('relationship')) {
      const relationship = await relationshipsService.retrieveVersionById(stixId, modified);
      await identitiesService.addCreatedByAndModifiedByIdentities(relationship);
      return relationship;
    }

    // Otherwise use base class implementation
    return super.retrieveVersionById(stixId, modified);
  }

  /**
   * Retrieve multiple attack objects by their version identifiers, handling relationships separately
   * @param {Array<{object_ref: string, modified: string}>} xMitreContents - Array of x_mitre_contents elements
   * @returns {Promise<Array<Object>>} Array of attack objects and relationships with identities populated
   */
  async getBulkByIdAndModified(xMitreContents) {
    const relationshipIdAndModified = xMitreContents.filter((content) =>
      content.object_ref.startsWith('relationship'),
    );
    const nonRelationshipIdAndModified = xMitreContents.filter(
      (content) => !content.object_ref.startsWith('relationship'),
    );

    const [relationships, nonRelationships] = await Promise.all([
      relationshipIdAndModified.length > 0
        ? relationshipsService.getBulkByIdAndModified(relationshipIdAndModified)
        : [],
      nonRelationshipIdAndModified.length > 0
        ? super.getBulkByIdAndModified(nonRelationshipIdAndModified)
        : [],
    ]);

    return [...relationships, ...nonRelationships];
  }

  /**
   * Record that this object is part of a collection
   */
  async insertCollection(stixId, modified, collectionId, collectionModified) {
    // Validate inputs
    if (!stixId || !modified || !collectionId || !collectionModified) {
      throw new Error('Missing required parameter');
    }

    // Get the document
    const document = await this.retrieveVersionById(stixId, modified);
    if (!document) {
      throw new Error('Document not found');
    }

    // Create the collection reference
    const collection = {
      collection_ref: collectionId,
      collection_modified: collectionModified,
    };

    // Initialize collections array if needed
    if (!document.workspace.collections) {
      document.workspace.collections = [];
    }

    // Check for duplicate collection
    const isDuplicate = document.workspace.collections.some(
      (item) =>
        item.collection_ref === collection.collection_ref &&
        item.collection_modified === collection.collection_modified,
    );
    if (isDuplicate) {
      throw new Error('Duplicate collection');
    }

    // Add collection and save
    document.workspace.collections.push(collection);
    return this.repository.saveDocument(document);
  }

  /**
   * Override of base class create() because:
   * 1. create() requires a STIX `type` -- this service does not define a type
   */
  // eslint-disable-next-line no-unused-vars
  create(data, options) {
    throw new NotImplementedError(this.constructor.name, 'create');
  }

  async findByIdAndUpdate(documentId, update) {
    try {
      return await this.repository.findByIdAndUpdate(documentId, update);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findByIdAndDelete(documentId) {
    try {
      const deletedDocument = await this.repository.findByIdAndDelete(documentId);
      if (deletedDocument) {
        logger.verbose('Document deleted:', documentId);
      } else {
        logger.warn('Document not found');
      }
    } catch (err) {
      logger.error(err.message);
      throw DatabaseError(err);
    }
  }

  async retrieveOneByVersionLean(stixId, stixModified) {
    try {
      return await this.repository.retrieveOneByVersionLean(stixId, stixModified);
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports.AttackObjectsService = AttackObjectsService;

// Export an instance of the service
module.exports = new AttackObjectsService(null, attackObjectsRepository);
