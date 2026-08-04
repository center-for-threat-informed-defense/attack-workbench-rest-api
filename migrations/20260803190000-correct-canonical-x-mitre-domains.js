'use strict';

/**
 * Correct canonical-domain successor revisions created from legacy collection
 * appearance metadata.
 *
 * The original backfill now uses exact canonical collection TOC membership.
 * Deployments that already ran its earlier form may contain domain-only
 * successor revisions with domains inherited from secondary bundle
 * appearances. This forward migration recognizes only semantic domain-only
 * successors whose historical predecessor has an exact canonical TOC pin and
 * creates another immutable revision with that authoritative domain union.
 */

const logger = require('../app/lib/logger');
const canonicalDomainMigration = require('./20260730230000-backfill-canonical-x-mitre-domains');

const MIGRATION_NAME = '20260803190000-correct-canonical-x-mitre-domains';

module.exports = {
  async up(db, client) {
    const report = await canonicalDomainMigration._private.run(db, client, {
      migrationName: MIGRATION_NAME,
      correctIncorrect: true,
    });
    logger.info(`[${MIGRATION_NAME}] ${JSON.stringify(report)}`);
  },

  async down() {
    logger.info(
      `[${MIGRATION_NAME}] down migration is a no-op: immutable correction revisions are retained`,
    );
  },
};
