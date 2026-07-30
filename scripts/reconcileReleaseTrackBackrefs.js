#!/usr/bin/env node

'use strict';

const mongoose = require('mongoose');

function parseOptions(argv) {
  const all = argv.includes('--all');
  const limitArgument = argv.find((argument) => argument.startsWith('--limit='));
  const limit = limitArgument ? Number(limitArgument.split('=')[1]) : 100;

  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
    throw new Error('--limit must be an integer between 1 and 10000');
  }

  return { all, limit };
}

async function run() {
  const options = parseOptions(process.argv.slice(2));
  await require('../app/lib/database-connection').initializeConnection();

  // Loading the owning services registers both required reconciliation
  // listeners before the repair dispatches any events.
  require('../app/services/stix/attack-objects-service');
  require('../app/services/stix/relationships-service');
  const reconciliationService = require('../app/services/release-tracks/reconciliation-service');

  const results = options.all
    ? await reconciliationService.reconcileAll({ continueOnError: true })
    : await reconciliationService.repairOutstanding({
        limit: options.limit,
        continueOnError: true,
      });
  const failed = results.filter((result) => result.status === 'failed');

  console.log(
    JSON.stringify(
      {
        mode: options.all ? 'full_scan' : 'outstanding',
        processed: results.length,
        completed: results.length - failed.length,
        failed: failed.length,
        results,
      },
      null,
      2,
    ),
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
