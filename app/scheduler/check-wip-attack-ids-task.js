'use strict';

const logger = require('../lib/logger');
const config = require('../config/config');

// Import all repository types that can have ATT&CK IDs
const techniquesRepository = require('../repository/techniques-repository');
const tacticsRepository = require('../repository/tactics-repository');
const groupsRepository = require('../repository/groups-repository');
const softwareRepository = require('../repository/software-repository');
const mitigationsRepository = require('../repository/mitigations-repository');
const campaignsRepository = require('../repository/campaigns-repository');
const dataSourcesRepository = require('../repository/data-sources-repository');
const dataComponentsRepository = require('../repository/data-components-repository');

// Map of STIX types to their repositories
const STIX_TYPE_TO_REPOSITORY = {
  'attack-pattern': { repo: techniquesRepository, name: 'techniques' },
  'x-mitre-tactic': { repo: tacticsRepository, name: 'tactics' },
  'intrusion-set': { repo: groupsRepository, name: 'groups' },
  malware: { repo: softwareRepository, name: 'software (malware)' },
  tool: { repo: softwareRepository, name: 'software (tool)' },
  'course-of-action': { repo: mitigationsRepository, name: 'mitigations' },
  campaign: { repo: campaignsRepository, name: 'campaigns' },
  'x-mitre-data-source': { repo: dataSourcesRepository, name: 'data-sources' },
  'x-mitre-data-component': { repo: dataComponentsRepository, name: 'data-components' },
};

/**
 * Check for work-in-progress objects that have ATT&CK IDs assigned
 *
 * This task identifies objects that are in "work-in-progress" state but have
 * ATT&CK IDs assigned. This is a concern because:
 * 1. WIP objects may never be published, wasting limited ATT&CK ID space
 * 2. The numeric range for ATT&CK IDs is limited (0001-9999 per type)
 * 3. Automatic ID assignment could exhaust the pool more quickly
 *
 * @returns {Promise<object>} Summary of findings
 */
async function checkWipAttackIds() {
  logger.info('[check-wip-attack-ids] Starting check for WIP objects with ATT&CK IDs');

  const results = {
    timestamp: new Date().toISOString(),
    totalWipWithIds: 0,
    byType: {},
    objects: [],
  };

  try {
    // Check each repository type
    for (const [, { repo, name }] of Object.entries(STIX_TYPE_TO_REPOSITORY)) {
      logger.debug(`[check-wip-attack-ids] Checking ${name} objects`);

      // Query for objects in work-in-progress state
      // Use retrieveAll with state filter
      const queryResult = await repo.retrieveAll({
        state: 'work-in-progress',
        includeRevoked: true,
        includeDeprecated: true,
        offset: 0,
        limit: 0, // Get all results
      });

      // Extract documents from the result structure
      const allWipObjects = queryResult[0]?.documents || [];

      // Filter to only those with attack_id set
      const wipObjectsWithIds = allWipObjects.filter(
        (obj) => obj.workspace?.attack_id && obj.workspace.attack_id !== null,
      );

      if (wipObjectsWithIds.length > 0) {
        logger.warn(
          `[check-wip-attack-ids] Found ${wipObjectsWithIds.length} WIP ${name} object(s) with ATT&CK IDs`,
        );

        results.byType[name] = wipObjectsWithIds.length;
        results.totalWipWithIds += wipObjectsWithIds.length;

        // Add details for each object
        for (const obj of wipObjectsWithIds) {
          results.objects.push({
            stixId: obj.stix.id,
            stixType: obj.stix.type,
            attackId: obj.workspace.attack_id,
            name: obj.stix.name || '(unnamed)',
            modified: obj.stix.modified,
          });
        }
      }
    }

    if (results.totalWipWithIds > 0) {
      logger.warn(
        `[check-wip-attack-ids] ALERT: ${results.totalWipWithIds} work-in-progress object(s) have ATT&CK IDs assigned`,
      );
      logger.warn(
        `[check-wip-attack-ids] This may indicate premature ID exhaustion. Consider reviewing these objects.`,
      );

      // Log summary by type
      for (const [type, count] of Object.entries(results.byType)) {
        logger.warn(`[check-wip-attack-ids]   - ${type}: ${count}`);
      }
    } else {
      logger.info('[check-wip-attack-ids] No WIP objects with ATT&CK IDs found');
    }
  } catch (err) {
    logger.error(`[check-wip-attack-ids] Error during check: ${err.message}`);
    logger.error(err.stack);
    throw err;
  }

  logger.info('[check-wip-attack-ids] Check complete');
  return results;
}

/**
 * Schedule this task using node-schedule
 *
 * @param {object} schedule - The node-schedule module
 */
async function scheduleMe(schedule) {
  // Get interval from config (defaults to 1 hour if not specified)
  const intervalSeconds = config.scheduler.checkWipAttackIdsInterval || 3600; // 1 hour default

  logger.info(
    `[check-wip-attack-ids] Scheduling task to run every ${intervalSeconds} seconds (${Math.floor(intervalSeconds / 60)} minutes)`,
  );

  // Schedule the job to run at the specified interval
  // If interval is >= 60 seconds, use minute-based scheduling
  if (intervalSeconds >= 60) {
    const intervalMinutes = Math.floor(intervalSeconds / 60);
    const minuteRule = new schedule.RecurrenceRule();
    minuteRule.minute = new schedule.Range(0, 59, intervalMinutes);
    minuteRule.second = 0;

    schedule.scheduleJob(minuteRule, async () => {
      try {
        await checkWipAttackIds();
      } catch (err) {
        logger.error(`[check-wip-attack-ids] Task execution failed: ${err.message}`);
      }
    });
  } else {
    // For intervals < 60 seconds, use a simpler cron pattern
    const rule = new schedule.RecurrenceRule();
    rule.second = new schedule.Range(0, 59, Math.max(10, intervalSeconds));

    schedule.scheduleJob(rule, async () => {
      try {
        await checkWipAttackIds();
      } catch (err) {
        logger.error(`[check-wip-attack-ids] Task execution failed: ${err.message}`);
      }
    });
  }

  logger.info('[check-wip-attack-ids] Task scheduled successfully');
}

// Export the scheduleMe function (required by the scheduler)
module.exports = {
  scheduleMe,
  checkWipAttackIds, // Export for testing
};
