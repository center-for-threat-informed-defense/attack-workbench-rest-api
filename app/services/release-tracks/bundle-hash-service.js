'use strict';

const crypto = require('node:crypto');
const exportService = require('./export-service');

function hashDownloadPayload(payload) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload, null, 4), 'utf8')
    .digest('hex');
}

async function generateBundleHashes(snapshot) {
  const [stix20Bundle, stix21Bundle] = await Promise.all([
    exportService.exportSnapshot(snapshot, 'bundle', { stixVersion: '2.0' }),
    exportService.exportSnapshot(snapshot, 'bundle', { stixVersion: '2.1' }),
  ]);
  return {
    manifest_id: snapshot.content_manifest_id,
    stix_2_0: hashDownloadPayload(stix20Bundle),
    stix_2_1: hashDownloadPayload(stix21Bundle),
  };
}

module.exports = {
  generateBundleHashes,
  hashDownloadPayload,
};
