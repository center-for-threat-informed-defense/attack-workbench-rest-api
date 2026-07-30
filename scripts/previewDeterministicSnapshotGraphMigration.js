'use strict';

const mongoose = require('mongoose');
const database = require('../app/lib/database-connection');
const migration = require('../migrations/20260730180000-backfill-deterministic-snapshot-graphs');

async function main() {
  await database.initializeConnection();
  const report = await migration._private.run(mongoose.connection.db, {
    dryRun: true,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`${err.stack || err.message}\n`);
    if (err.missing_relationship_endpoints) {
      process.stderr.write(
        `${JSON.stringify(
          { missing_relationship_endpoints: err.missing_relationship_endpoints },
          null,
          2,
        )}\n`,
      );
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
