'use strict';
const yaml = require('js-yaml');
const fs = require('fs');

const {
  techniqueSchema,
  campaignSchema,
  tacticSchema,
  // Add more schemas as needed
} = require('@mitre-attack/attack-data-model');

const logger = require('../lib/logger');

function listToDict(list) {
  return Object.fromEntries(list.map(prop => [prop, true]));
}

// Utility: Extract required fields for a schema from YAML (handles allOf)
function getRequiredFields(doc, schemaName) {
  const schema = doc.components.schemas[schemaName];
  if (!schema) throw new Error(`Schema "${schemaName}" not found`);
  let required = [];

  if (schema.required) {
    required = schema.required;
  }
  // Handle allOf
  if (schema.allOf) {
    for (const item of schema.allOf) {
      if (item.required) {
        required = required.concat(item.required);
      }
    }
  }
  return required;
}
class ValidationService {
  constructor() {
    // Map STIX types to schemas
    this.stixSchemas = {
      'attack-pattern': techniqueSchema,
      'campaign': campaignSchema,
      'x-mitre-tactic': tacticSchema
    };

    this.stixToAttack = {
      'attack-pattern': 'techniques',
      'campaign': 'campaigns',
      'x-mitre-tactic': 'tactics',
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
    const attackType = this.stixToAttack[type];
    if (!attackType) {
      return { errors: [`Unknown STIX type: ${type}`] };
    }
    const file = fs.readFileSync(`app/api/definitions/components/${attackType}.yml`, 'utf8');
    const doc = yaml.load(file);
    const req = getRequiredFields(doc,stix.type + '-stix-object');
    const props = req;
    const dict = listToDict(props);
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
      result = schema.partial().required(dict).safeParse(stix);
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
