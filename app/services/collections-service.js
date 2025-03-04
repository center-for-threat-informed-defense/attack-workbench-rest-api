'use strict';

const BaseService = require('./_base.service');
const collectionRepository = require('../repository/collections-repository');
const { Collection: CollectionType } = require('../lib/types');

const attackObjectsService = require('./attack-objects-service');

const {
  MissingParameterError,
  BadlyFormattedParameterError,
  InvalidQueryStringParameterError,
} = require('../exceptions');

class CollectionsService extends BaseService {
  // TODO this linting bypass can be removed after we refactor - AttackObject model should be proxied through a service; attackObjectsService can potentially be moved to a class instance variable (e.g., this.attackObjectsService)

  async getContents(objectList) {
    const contents = [];
    for (const objectRef of objectList) {
      try {
        const attackObject = await attackObjectsService.retrieveVersionById(
          objectRef.object_ref,
          objectRef.object_modified,
        );
        if (attackObject) {
          contents.push(attackObject);
        }
      } catch (err) {
        // Ignore lookup errors for individual objects
        console.error(`Error retrieving object ${objectRef.object_ref}:`, err);
      }
    }
    return contents;
  }

  async retrieveById(stixId, options) {
    if (!stixId) {
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    let collections;
    if (options.versions === 'all') {
      collections = await this.repository.retrieveOneByIdLean(stixId);

      if (options.retrieveContents) {
        for (const collection of collections) {
          collection.contents = await this.getContents(collection.stix.x_mitre_contents);
        }
      }
    } else if (options.versions === 'latest') {
      const collection = await this.repository.retrieveLatestByStixId(stixId);

      if (collection) {
        if (options.retrieveContents) {
          collection.contents = await this.getContents(collection.stix.x_mitre_contents);
        }
        collections = [collection];
      } else {
        collections = [];
      }
    } else {
      throw new InvalidQueryStringParameterError({ parameterName: 'versions' });
    }

    return collections;
  }

  async retrieveVersionById(stixId, modified, options = {}) {
    if (!stixId) {
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!modified) {
      throw new MissingParameterError({ parameterName: 'modified' });
    }

    const collection = await this.repository.retrieveOneByVersionLean(stixId, modified);

    if (!collection) {
      return null;
    }

    if (options.retrieveContents) {
      collection.contents = await this.getContents(collection.stix.x_mitre_contents);
    }

    await this.addCreatedByAndModifiedByIdentities(collection);
    return collection;
  }

  // TODO this linting bypass can be removed after we refactor - AttackObject model should be proxied through a service; attackObjectsService can potentially be moved to a class instance variable (e.g., this.attackObjectsService)

  async addObjectsToCollection(objectList, collectionID, collectionModified) {
    const insertionErrors = [];
    for (const attackObject of objectList) {
      try {
        await attackObjectsService.insertCollection(
          attackObject.object_ref,
          attackObject.object_modified,
          collectionID,
          collectionModified,
        );
      } catch (err) {
        insertionErrors.push(err);
      }
    }
    return insertionErrors;
  }

  async create(data, options = {}) {
    const savedCollection = await super.create(data, options);

    let insertionErrors = [];
    if (options.addObjectsToCollection) {
      insertionErrors = await this.addObjectsToCollection(
        savedCollection.stix.x_mitre_contents,
        savedCollection.stix.id,
        savedCollection.stix.modified,
      );
    }

    return { savedCollection, insertionErrors };
  }

  // TODO get rid of direct calls to AttackObject model
  // TODO move query logic into CollectionsRepository::findWithContents
  async deleteAllContentsOfCollection(collection, stixId, modified) {
    for (const reference of collection.stix.x_mitre_contents) {
      const referenceObj = await attackObjectsService.retrieveOneByVersionLean(
        reference.object_ref,
        reference.object_modified,
      );

      if (!referenceObj) {
        continue;
      }

      const matchQuery = {
        'stix.id': { $ne: stixId },
        'stix.x_mitre_contents': {
          $elemMatch: {
            object_ref: reference.object_ref,
            object_modified: reference.object_modified,
          },
        },
      };

      if (modified) {
        delete matchQuery['stix.id'];
        matchQuery['$or'] = [
          { 'stix.id': { $ne: stixId } },
          { 'stix.modified': { $ne: modified } },
        ];
      }

      const matches = await this.repository.findWithContents(matchQuery, { lean: true });

      if (matches.length === 0) {
        // If this attack object is NOT in another collection, delete it
        await attackObjectsService.findByIdAndDelete(referenceObj._id);
      } else if (referenceObj.workspace?.collections) {
        // If this object IS in another collection, update the workspace.collections array
        const newCollectionsArr = referenceObj.workspace.collections.filter(
          (collectionElem) => collectionElem.collection_ref !== stixId,
        );
        await attackObjectsService.findByIdAndUpdate(referenceObj.id, {
          'workspace.collections': newCollectionsArr,
        });
      }
    }
  }

  async delete(stixId, deleteAllContents = false) {
    if (!stixId) {
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    const collections = await this.repository.retrieveOneByIdLean(stixId);
    if (!collections) {
      throw new BadlyFormattedParameterError({ parameterName: 'stixId' });
    }

    if (deleteAllContents) {
      for (const collection of collections) {
        await this.deleteAllContentsOfCollection(collection, stixId);
      }
    }

    return await this.repository.deleteMany(stixId);
  }

  async deleteVersionById(stixId, modified, deleteAllContents = false) {
    if (!stixId) {
      throw new MissingParameterError({ parameterName: 'stixId' });
    }

    if (!modified) {
      throw new MissingParameterError({ parameterName: 'modified' });
    }

    const collection = await this.repository.retrieveOneByVersionLean(stixId, modified);

    if (!collection) {
      throw new BadlyFormattedParameterError({ parameterName: 'stixId' });
    }

    if (deleteAllContents) {
      await this.deleteAllContentsOfCollection(collection, stixId, modified);
    }

    return await this.repository.findOneAndDelete(stixId, modified);
  }

  async insertExport(stixId, modified, exportData) {
    if (!stixId || !modified || !exportData) {
      throw new MissingParameterError();
    }

    return await this.repository.insertExport(stixId, modified, exportData);
  }
}

module.exports = new CollectionsService(CollectionType, collectionRepository);
