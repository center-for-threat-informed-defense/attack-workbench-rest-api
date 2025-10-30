'use strict';

const schedule = require('node-schedule');
const logger = require('../lib/logger');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

/**
 * Initialize the scheduler by loading all task modules and scheduling them
 */
async function initializeScheduler() {
  if (!config.scheduler.enableScheduler) {
    logger.info('Scheduler is disabled by configuration');
    return;
  }

  logger.info('Initializing node-schedule based scheduler');

  // Find all *-task.js files in the scheduler directory
  const schedulerDir = __dirname;
  const taskFiles = fs.readdirSync(schedulerDir).filter((file) => file.endsWith('-task.js'));

  logger.info(`Found ${taskFiles.length} task file(s) to load`);

  // Load and schedule each task
  for (const taskFile of taskFiles) {
    const taskPath = path.join(schedulerDir, taskFile);
    logger.info(`Loading task from ${taskFile}`);

    try {
      const taskModule = require(taskPath);

      // Validate that the module exports a scheduleMe function
      if (typeof taskModule.scheduleMe !== 'function') {
        logger.error(`Task file ${taskFile} does not export a 'scheduleMe' function. Skipping.`);
        continue;
      }

      // Call scheduleMe to schedule the task
      await taskModule.scheduleMe(schedule);
      logger.info(`Successfully scheduled task from ${taskFile}`);
    } catch (err) {
      logger.error(`Failed to load or schedule task from ${taskFile}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  logger.info('Scheduler initialization complete');
}

module.exports = {
  initializeScheduler,
};
