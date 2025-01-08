'use strict';

const BaseService = require('./_base.service');
const relationshipsRepository = require('../repository/relationships-repository');
const { Relationship: RelationshipType } = require('../lib/types');

// Map STIX types to ATT&CK types
const objectTypeMap = new Map([
  ['malware', 'software'],
  ['tool', 'software'],
  ['attack-pattern', 'technique'],
  ['intrusion-set', 'group'],
  ['campaign', 'campaign'],
  ['x-mitre-asset', 'asset'],
  ['course-of-action', 'mitigation'],
  ['x-mitre-tactic', 'tactic'],
  ['x-mitre-matrix', 'matrix'],
  ['x-mitre-data-component', 'data-component'],
]);

class RelationshipsService extends BaseService {
  async retrieveAll(options) {
    let results = await super.retrieveAll(options);

    if (options.lookupRefs) {
      results = Array.isArray(results) ? results : results.data;

      // Filter by source type if specified
      if (options.sourceType) {
        results = results.filter((document) => {
          if (document.source_objects?.length === 0) {
            return false;
          }
          document.source_objects.sort((a, b) => b.stix.modified - a.stix.modified);
          return objectTypeMap.get(document.source_objects[0].stix.type) === options.sourceType;
        });
      }

      // Filter by target type if specified
      if (options.targetType) {
        results = results.filter((document) => {
          if (document.target_objects?.length === 0) {
            return false;
          }
          document.target_objects.sort((a, b) => b.stix.modified - a.stix.modified);
          return objectTypeMap.get(document.target_objects[0].stix.type) === options.targetType;
        });
      }

      // Move latest source and target objects to non-array properties
      for (const document of results) {
        if (Array.isArray(document.source_objects)) {
          if (document.source_objects.length === 0) {
            document.source_objects = undefined;
          } else {
            document.source_object = document.source_objects[0];
            document.source_objects = undefined;
          }
        }

        if (Array.isArray(document.target_objects)) {
          if (document.target_objects.length === 0) {
            document.target_objects = undefined;
          } else {
            document.target_object = document.target_objects[0];
            document.target_objects = undefined;
          }
        }
      }
    }

    // this does not work:
    // return RelationshipsService.paginate(options, results);

    if (options.includePagination) {
      return {
        pagination: {
          total: results.length,
          offset: options.offset,
          limit: options.limit,
        },
        data: results,
      };
    }

    return results;
  }
}

module.exports = new RelationshipsService(RelationshipType, relationshipsRepository);
