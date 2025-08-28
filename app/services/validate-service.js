'use strict';

const {
  techniqueSchema,
  campaignSchema,
  // Add more schemas as needed
} = require('@mitre-attack/attack-data-model');

const logger = require('../lib/logger');

// function hasValue(field) {
//   return (
//     field !== undefined &&
//     field !== null &&
//     field !== '' &&
//     !(Array.isArray(field) && field.length === 0)
//   );
// }

// function filterObject(obj) {
//   return Object.fromEntries(Object.entries(obj).filter((entry) => hasValue(entry[1])));
// }
class ValidationService {
  constructor() {
    // Map STIX types to schemas
    this.stixSchemas = {
      'attack-pattern': techniqueSchema,
      campaign: campaignSchema,
    };
  }

  /**
   * Validate a STIX object against its schema.
   * @param {string} type - The STIX type (e.g., 'attack-pattern', 'campaign')
   * @param {object} status - The workflow status of the object "work-in-progress" || "awaiting-reviewed" || "reviewed"
   * @param {object} stix - The STIX object to validate
   * @returns {object} { errors: Array }
   */
  validate(type, status, stix) {
    const schema = this.stixSchemas[type];
    if (!schema) {
      logger.warn(`Unknown STIX type: ${type}`);
      return {
        errors: [
          {
            code: 'unknown_type',
            path: ['type'],
            message: `Unknown STIX type: ${type}`,
          },
        ],
      };
    }

    const omit_dict = { x_mitre_modified_by_ref: true, x_mitre_attack_spec_version: true };
    if (stix.type == 'campaign' || stix.type == 'intrusion-set') {
      omit_dict.x_mitre_domains = true;
    }

    let result;

    if (status == 'work-in-progress') {
      result = schema.partial().safeParse(stix);
    } else {
      result = schema.omit(omit_dict).safeParse(stix);
    }

    if (result.success) {
      return { errors: [] };
    } else {
      // Map Zod errors to your error format
      return {
        errors: result.error.issues.map((err) => ({
          code: err.code,
          path: err.path,
          message: err.message,
        })),
      };
    }
  }
}

module.exports = ValidationService;
