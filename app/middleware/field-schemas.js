'use strict';

const {
  nameSchema,
  tacticIdSchema,
  descriptionSchema,
  externalReferencesSchema,
  objectMarkingRefsSchema,
  xMitreDomainsSchema,
  xMitreShortNameSchema,
  xMitreModifiedByRefSchema,
  stixTypeSchema,
  xMitreContributorsSchema,
  xMitreAttackSpecVersionSchema,
  xMitreVersionSchema,
  xMitreOldAttackIdSchema,
  xMitreDeprecatedSchema,
} = require('@mitre-attack/attack-data-model');

const fieldSchemas = {
  name: nameSchema,
  id: tacticIdSchema,
  type: stixTypeSchema,
  x_mitre_version: xMitreVersionSchema,
  description: descriptionSchema,
  created_by_ref: descriptionSchema,
  external_references: externalReferencesSchema,
  object_marking_refs: objectMarkingRefsSchema,
  x_mitre_domains: xMitreDomainsSchema,
  x_mitre_attack_spec_version: xMitreAttackSpecVersionSchema,
  x_mitre_shortname: xMitreShortNameSchema,
  x_mitre_modified_by_ref: xMitreModifiedByRefSchema,
  x_mitre_contributors: xMitreContributorsSchema,
  x_mitre_old_attack_id: xMitreOldAttackIdSchema,
  x_mitre_deprecated: xMitreDeprecatedSchema,
};

module.exports = fieldSchemas;
