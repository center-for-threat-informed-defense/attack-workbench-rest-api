'use strict';

const {
  techniqueSchema,
  campaignSchema,
  // Add more schemas as needed
} = require('@mitre-attack/attack-data-model');

const logger = require('../lib/logger');

class ValidationService {
  constructor() {
    // Map STIX types to schemas
    this.stixSchemas = {
      'attack-pattern': techniqueSchema,
      'campaign': campaignSchema,
    };
  }

  /**
   * Validate a STIX object against its schema.
   * @param {string} type - The STIX type (e.g., 'attack-pattern', 'campaign')
   * @param {object} stix - The STIX object to validate
   * @returns {object} { errors: Array }
   */
  validate(type, stix) {
    const schema = this.stixSchemas[type];
    if (!schema) {
      logger.warn(`Unknown STIX type: ${type}`);
      return {
        errors: [{
          code: 'unknown_type',
          path: ['type'],
          message: `Unknown STIX type: ${type}`
        }]
      };
    }

    const result = schema.partial().safeParse(stix);

    if (result.success) {
      return { errors: [] };
    } else {
      // Map Zod errors to your error format
      return {
        errors: result.error.issues.map(err => ({
          code: err.code,
          path: err.path,
          message: err.message
        }))
      };
    }
  }
}

module.exports = ValidationService;
