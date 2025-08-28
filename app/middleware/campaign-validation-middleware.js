'use strict';

const { campaignSchema } = require('@mitre-attack/attack-data-model');
const logger = require('../lib/logger');
const campaignsService = require('../services/campaigns-service');
const { workflowStates } = require('../dtos');

/**
 * Middleware to validate a campaign object against the ATT&CK Data Model
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

function filterObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter((entry) => hasValue(entry[1])));
}

module.exports = async function validateCampaignForSpecCompliance(req, res, next) {
  const campaignData = req.body;

  // Skip validation if campaign is not in 'awaiting-review' state
  if (
    !campaignData?.workspace?.workflow?.state ||
    (campaignData.workspace.workflow.state !== workflowStates.WorkflowStates.AWAITING_REVIEW &&
      campaignData.workspace.workflow.state !== workflowStates.WorkflowStates.REVIEWED)
  ) {
    try {
      // Validate the campaign object using the ATT&CK Data Model
      logger.debug(`Validating campaign ${campaignData.stix.id} against ATT&CK Data Model`);
      const campaignDataFiltered = filterObject(campaignData.stix);
      const validationResult = campaignSchema.partial().safeParse(campaignDataFiltered);
      if (!validationResult.success) {
        // Format Zod errors into a more readable structure
        const errors = validationResult.error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn(
          logger.warn(
            `Campaign validation failed for ${campaignData.stix.id}: ${JSON.stringify(errors)}`,
          ),
        );

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Campaign does not meet ATT&CK Data Model requirements',
          details: errors,
        });
      }
      return next();
    } catch (err) {
      logger.error(`Campaign validation error: ${err.message}`);
      return res.status(500).send('Unable to validate campaign. Server error.');
    }
  }

  try {
    // Check if we're updating an existing campaign
    const isUpdate = req.params.stixId && req.params.modified;

    if (isUpdate) {
      const existingCampaign = await campaignsService.retrieveVersionById(
        req.params.stixId,
        req.params.modified,
      );

      // Only validate if transitioning from 'work-in-progress' to 'awaiting-review'
      if (!workflowStates.isTransitioningToReview(campaignData, existingCampaign)) {
        return next();
      }
    }

    // Validate the campaign object using the ATT&CK Data Model
    logger.debug(`Validating campaign ${campaignData.stix.id} against ATT&CK Data Model`);

    // Use the partial schema to validate only the fields provided in req.body.stix
    const validationResult = campaignSchema.safeParse(campaignData.stix);

    // Use the ATT&CK Data Model's campaign schema to validate
    // This uses Zod for validation with robust error reporting
    // const validationResult = campaignSchema.safeParse(campaignData.stix);

    if (!validationResult.success) {
      // Format Zod errors into a more readable structure
      const errors = validationResult.error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      logger.warn(
        `Campaign validation failed for ${campaignData.stix.id}: ${JSON.stringify(errors)}`,
      );

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Campaign does not meet ATT&CK Data Model requirements',
        details: errors,
      });
    }

    logger.debug(
      `Campaign ${campaignData.stix.id} successfully validated against ATT&CK Data Model schema`,
    );
    return next();
  } catch (err) {
    logger.error(`Campaign validation error: ${err.message}`);
    return res.status(500).send('Unable to validate campaign. Server error.');
  }
};
