'use strict';

const relationshipsRepository = require('../repository/relationships-repository');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const BaseService = require('./_base.service');
const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

// Map STIX types to ATT&CK types
const objectTypeMap = new Map();
objectTypeMap.set('malware', 'software');
objectTypeMap.set('tool', 'software');
objectTypeMap.set('attack-pattern', 'technique');
objectTypeMap.set('intrusion-set', 'group');
objectTypeMap.set('campaign', 'campaign');
objectTypeMap.set('x-mitre-asset', 'asset');
objectTypeMap.set('course-of-action', 'mitigation');
objectTypeMap.set('x-mitre-tactic', 'tactic');
objectTypeMap.set('x-mitre-matrix', 'matrix');
objectTypeMap.set('x-mitre-data-component', 'data-component');

class RelationshipsService extends BaseService {

}

module.exports = new RelationshipsService('relationship', relationshipsRepository);

