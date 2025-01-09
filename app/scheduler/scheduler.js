'use strict';

const collectionIndexesService = require('../services/collection-indexes-service');
const collectionsService = require('../services/collections-service');
const collectionBundlesService = require('../services/collection-bundles-service');

const logger = require('../lib/logger');
const config = require('../config/config');
const async = require('async');

let timer;
exports.initializeScheduler = function () {
  logger.info('Starting the scheduler');

  const intervalMilliseconds = config.scheduler.checkWorkbenchInterval * 1000;
  timer = setInterval(runCheckCollectionIndexes, intervalMilliseconds);
};

exports.stopScheduler = function () {
  if (timer) {
    clearInterval(timer);
  }
};

const scheduledSubscriptions = new Map();

function runCheckCollectionIndexes() {
  logger.info('Scheduler running...');
  const options = {
    offset: 0,
    limit: 0,
  };
  collectionIndexesService.retrieveAll(options, function (err, collectionIndexes) {
    if (err) {
      logger.error('Unable to get existing collection indexes: ' + err);
    } else {
      for (const collectionIndex of collectionIndexes) {
        if (collectionIndex.collection_index && collectionIndex.workspace.update_policy.automatic) {
          // Is it time to retrieve the collection index from the remote URL?
          let lastRetrieval;
          const now = Date.now();
          if (collectionIndex.workspace.update_policy.last_retrieval) {
            lastRetrieval = new Date(collectionIndex.workspace.update_policy.last_retrieval);
          }
          if (
            !lastRetrieval ||
            now - lastRetrieval > 1000 * collectionIndex.workspace.update_policy.interval
          ) {
            logger.info(
              `Checking collection index: ${collectionIndex.collection_index.name} (${collectionIndex.collection_index.id})`,
            );
            logger.verbose(
              'Retrieving collection index from remote url ' + collectionIndex.workspace.remote_url,
            );
            collectionIndexesService.retrieveByUrl(
              collectionIndex.workspace.remote_url,
              function (err, remoteCollectionIndex) {
                if (err) {
                  logger.error('Unable to retrieve collection index from remote url. ' + err);
                } else {
                  const remoteTimestamp = new Date(remoteCollectionIndex.modified);
                  const existingTimestamp = new Date(collectionIndex.collection_index.modified);
                  if (remoteTimestamp > existingTimestamp) {
                    logger.info(
                      'The retrieved collection index is newer. Updating collection index in workbench.',
                    );
                    collectionIndex.collection_index = remoteCollectionIndex;
                    collectionIndex.workspace.update_policy.last_retrieval = new Date(
                      now,
                    ).toISOString();

                    collectionIndexesService.updateFull(
                      collectionIndex.collection_index.id,
                      collectionIndex,
                      function (err, savedCollectionIndex) {
                        if (err) {
                          logger.error('Unable to update collection index in workbench. ' + err);
                          return;
                        } else {
                          // Check subscribed collections
                          if (
                            scheduledSubscriptions.has(savedCollectionIndex.collection_index.id)
                          ) {
                            logger.info(
                              `Subscriptions for collection index ${savedCollectionIndex.collection_index.id} are already being checked`,
                            );
                          } else {
                            logger.verbose(
                              `Checking Subscriptions for collection index ${savedCollectionIndex.collection_index.id}`,
                            );
                            scheduledSubscriptions.set(
                              savedCollectionIndex.collection_index.id,
                              true,
                            );
                            subscriptionHandler(savedCollectionIndex, function (err) {
                              scheduledSubscriptions.delete(
                                savedCollectionIndex.collection_index.id,
                              );
                              if (err) {
                                logger.error(
                                  'Error checking subscriptions in collection index. ' + err,
                                );
                                return;
                              }
                            });
                          }
                        }
                      },
                    );
                  } else {
                    logger.verbose('The retrieved collection index is not newer.');
                    collectionIndex.workspace.update_policy.last_retrieval = new Date(
                      now,
                    ).toISOString();
                    collectionIndexesService.updateFull(
                      collectionIndex.collection_index.id,
                      collectionIndex,
                      function (err) {
                        if (err) {
                          logger.error('Unable to update collection index in workbench. ' + err);
                          return;
                        } else {
                          // Check subscribed collections
                          if (scheduledSubscriptions.has(collectionIndex.collection_index.id)) {
                            logger.info(
                              `Subscriptions for collection index ${collectionIndex.collection_index.id} are already being checked`,
                            );
                          } else {
                            logger.info(
                              `Checking Subscriptions for collection index ${collectionIndex.collection_index.id}`,
                            );
                            scheduledSubscriptions.set(collectionIndex.collection_index.id, true);
                            subscriptionHandler(collectionIndex, function (err) {
                              scheduledSubscriptions.delete(collectionIndex.collection_index.id);
                              if (err) {
                                logger.error(
                                  'Error checking subscriptions in collection index. ' + err,
                                );
                                return;
                              }
                            });
                          }
                        }
                      },
                    );
                  }
                }
              },
            );
          }
        }
      }
    }
  });
}

function subscriptionHandler(collectionIndex, callback) {
  // Check each subscription in the collection index
  async.eachSeries(
    collectionIndex.workspace.update_policy.subscriptions,
    function (collectionId, callback2) {
      // collections is a list of the versions of the collection that are in the Workbench data store
      collectionsService.retrieveById(
        collectionId,
        { versions: 'latest' },
        function (err, collections) {
          if (err) {
            return callback2(err);
          }

          // Get the corresponding collection info from the collection index
          // collectionInfo.versions is a list of versions that are available to be imported
          const collectionInfo = collectionIndex.collection_index.collections.find(
            (item) => item.id === collectionId,
          );
          if (!collectionInfo || collectionInfo.versions.length === 0) {
            // No versions available to import
            return callback2();
          }

          // Order both lists of collection versions, latest version first
          collections.sort((a, b) => b.stix.modified.getTime() - a.stix.modified.getTime());
          collectionInfo.versions.sort((a, b) => b.modified.getTime() - a.modified.getTime());

          if (
            collections.length === 0 ||
            collections[0].stix.modified < collectionInfo.versions[0].modified
          ) {
            // Latest version in collection index is later than latest version in the Workbench data store,
            // so we should import it
            logger.info(
              `Retrieving collection bundle from remote url ${collectionInfo.versions[0].url}`,
            );
            collectionsService.retrieveByUrl(
              collectionInfo.versions[0].url,
              function (err, collectionBundle) {
                if (err) {
                  const error = new Error('Unable to retrieve updated collection bundle. ' + err);
                  return callback2(error);
                }

                logger.info(`Downloaded updated collection bundle with id ${collectionBundle.id}`);

                // Find the x-mitre-collection objects
                const collections = collectionBundle.objects.filter(
                  (object) => object.type === 'x-mitre-collection',
                );

                // The bundle must have an x-mitre-collection object
                if (collections.length === 0) {
                  const error = new Error(
                    'Unable to import collection bundle. Collection bundle is missing x-mitre-collection object.',
                  );
                  return callback2(error);
                } else if (collections.length > 1) {
                  const error = new Error(
                    'Unable to import collection bundle. Collection bundle has more than one x-mitre-collection object.',
                  );
                  return callback2(error);
                }

                // The collection must have an id.
                if (collections.length > 0 && !collections[0].id) {
                  const error = new Error(
                    'Unable to import collection bundle. Badly formatted collection in bundle, x-mitre-collection missing id.',
                  );
                  return callback2(error);
                }

                const importOptions = {
                  previewOnly: false,
                  forceImportParameters: [],
                };
                collectionBundlesService.importBundle(
                  collections[0],
                  collectionBundle,
                  importOptions,
                  function (err, importedCollection) {
                    if (err) {
                      const error = new Error(
                        'Unable to import collection bundle into ATT&CK Workbench database. ' + err,
                      );
                      return callback2(error);
                    } else {
                      logger.info(
                        `Imported collection bundle with x-mitre-collection id ${importedCollection.stix.id}`,
                      );
                      return callback2();
                    }
                  },
                );
              },
            );
          } else {
            // Workbench data store is up-to-date, don't import new version
            return callback2();
          }
        },
      );
    },
    function (err) {
      if (err) {
        return callback(err);
      } else {
        return callback();
      }
    },
  );
}
