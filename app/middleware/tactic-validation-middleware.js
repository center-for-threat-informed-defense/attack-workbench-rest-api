'use strict';

const { tacticSchema } = require('@mitre-attack/attack-data-model');
const fieldSchemas = require('./field-schemas');
const logger = require('../lib/logger');
const tacticsService = require('../services/tactics-service');
const { workflowStates } = require('../dtos');

/**
 * Middleware to validate a tactic object against the ATT&CK Data Model
 * when transitioning from 'work-in-progress' to 'awaiting-review'
 */
function hasValue(field) {
  return (
    field !== undefined &&
    field !== null &&
    field !== '' &&
    !(Array.isArray(field) && field.length === 0)
  );
}

module.exports = async function validateTacticForSpecCompliance(req, res, next) {
  const tacticData = req.body;

  // Skip validation if tactic is not in 'awaiting-review' state
  if (
    !tacticData?.workspace?.workflow?.state ||
    (tacticData.workspace.workflow.state !== workflowStates.WorkflowStates.AWAITING_REVIEW &&
      tacticData.workspace.workflow.state !== workflowStates.WorkflowStates.REVIEWED)
  ) {
    try {
      // Validate the tactic object using the ATT&CK Data Model
      logger.debug(`Validating tactic ${tacticData.stix.id} against ATT&CK Data Model`);

      for (const [key, value] of Object.entries(tacticData.stix)) {
        if (fieldSchemas[key] && hasValue(value) && key != 'x_mitre_shortname') {
          console.log(`Key: ${key}, Value: ${value}`);

          // Dynamically validate the field using its schema
          const schema = fieldSchemas[key];
          const validationResult = schema.safeParse(value);

          if (!validationResult.success) {
            // Format Zod errors into a more readable structure
            const errors = validationResult.error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code,
            }));

            logger.warn(
              `Validation failed for field "${key}" in tactic ${tacticData.stix.id}: ${JSON.stringify(errors)}`,
            );

            return res.status(400).json({
              error: 'Validation Error',
              message: `Field "${key}" does not meet ATT&CK Data Model requirements`,
              details: errors,
            });
          }
        }
      }
      return next();
    } catch (err) {
      logger.error(`Tactic validation error: ${err.message}`);
      return res.status(500).send('Unable to validate tactic. Server error.');
    }
  }

  try {
    // Check if we're updating an existing tactic
    const isUpdate = req.params.stixId && req.params.modified;

    if (isUpdate) {
      const existingTactic = await tacticsService.retrieveVersionById(
        req.params.stixId,
        req.params.modified,
      );

      // Only validate if transitioning from 'work-in-progress' to 'awaiting-review'
      if (!workflowStates.isTransitioningToReview(tacticData, existingTactic)) {
        return next();
      }
    }

    // Validate the tactic object using the ATT&CK Data Model
    logger.debug(`Validating tactic ${tacticData.stix.id} against ATT&CK Data Model`);

    // Use the partial schema to validate only the fields provided in req.body.stix
    const validationResult = tacticSchema.safeParse(tacticData.stix);

    // Use the ATT&CK Data Model's tactic schema to validate
    // This uses Zod for validation with robust error reporting
    // const validationResult = tacticSchema.safeParse(tacticData.stix);

    if (!validationResult.success) {
      // Format Zod errors into a more readable structure
      const errors = validationResult.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      logger.warn(`Tactic validation failed for ${tacticData.stix.id}: ${JSON.stringify(errors)}`);

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Tactic does not meet ATT&CK Data Model requirements',
        details: errors,
      });
    }

    logger.debug(
      `Tactic ${tacticData.stix.id} successfully validated against ATT&CK Data Model schema`,
    );
    return next();
  } catch (err) {
    logger.error(`Tactic validation error: ${err.message}`);
    return res.status(500).send('Unable to validate tactic. Server error.');
  }
};
