'use strict';

const { techniqueSchema } = require('@mitre-attack/attack-data-model');
const logger = require('../lib/logger');
const techniquesService = require('../services/techniques-service');
const { workflowStates } = require('../dtos');

/**
 * Middleware to validate a technique object against the ATT&CK Data Model
 * when transitioning from 'work-in-progress' to 'awaiting-review'
 */
module.exports = async function validateTechniqueForSpecCompliance(req, res, next) {
  const techniqueData = req.body;

  // Skip validation if technique is not in 'awaiting-review' state
  if (
    !techniqueData?.workspace?.workflow?.state ||
    techniqueData.workspace.workflow.state !== workflowStates.WorkflowStates.AWAITING_REVIEW
  ) {
    return next();
  }

  try {
    // Check if we're updating an existing technique
    const isUpdate = req.params.stixId && req.params.modified;

    if (isUpdate) {
      const existingTechnique = await techniquesService.retrieveVersionById(
        req.params.stixId,
        req.params.modified,
      );

      // Only validate if transitioning from 'work-in-progress' to 'awaiting-review'
      if (!workflowStates.isTransitioningToReview(techniqueData, existingTechnique)) {
        return next();
      }
    }

    // Validate the technique object using the ATT&CK Data Model
    logger.debug(`Validating technique ${techniqueData.stix.id} against ATT&CK Data Model`);

    // Use the ATT&CK Data Model's technique schema to validate
    // This uses Zod for validation with robust error reporting
    const validationResult = techniqueSchema.safeParse(techniqueData.stix);

    if (!validationResult.success) {
      // Format Zod errors into a more readable structure
      const errors = validationResult.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      logger.warn(
        `Technique validation failed for ${techniqueData.stix.id}: ${JSON.stringify(errors)}`,
      );

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Technique does not meet ATT&CK Data Model requirements',
        details: errors,
      });
    }

    logger.debug(
      `Technique ${techniqueData.stix.id} successfully validated against ATT&CK Data Model schema`,
    );
    return next();
  } catch (err) {
    logger.error(`Technique validation error: ${err.message}`);
    return res.status(500).send('Unable to validate technique. Server error.');
  }
};
