'use strict';

const logger = require('../lib/logger');
const ValidationService = require('../services/validate-service');
const validateService = new ValidationService();

exports.validate = async function (req, res) {
  try {
    const { type, stix } = req.body || {};

    // Basic request validation
    if (typeof type !== 'string' || typeof stix !== 'object' || stix === null || Array.isArray(stix)) {
      logger.warn('Invalid request body for /api/validate');
      return res.status(400).json({
        errors: [{
          code: 'invalid_request',
          path: [],
          message: 'Request body must have a string "type" and an object "stix".'
        }]
      });
    }

    // Validate the STIX object using the instance method
    const result = validateService.validate(type, stix);

    if (result.errors.length && result.errors[0].code === 'unknown_type') {
      logger.warn(`Unknown STIX type: ${type}`);
      return res.status(400).json(result);
    }

    logger.debug(`Validation completed for type: ${type}`);
    return res.status(200).json(result);

  } catch (err) {
    logger.error('Failed to validate STIX object: ' + err);
    return res.status(500).send('Unable to validate STIX object. Server error.');
  }
};
