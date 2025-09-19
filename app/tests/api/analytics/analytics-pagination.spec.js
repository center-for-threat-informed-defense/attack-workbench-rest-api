const analyticsService = require('../../../services/analytics-service');
const PaginationTests = require('../../shared/pagination');

// modified and created properties will be set before calling REST API
// stix.id property will be created by REST API
const initialObjectData = {
  workspace: {
    workflow: {
      state: 'work-in-progress',
    },
  },
  stix: {
    name: 'analytic-1',
    spec_version: '2.1',
    type: 'x-mitre-analytic',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'AN9999',
        url: 'https://attack.mitre.org/analytics/AN9999',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '4.0.0',
    x_mitre_platforms: ['windows'],
    x_mitre_domains: ['enterprise-attack'],
    x_mitre_log_source_references: [
      {
        x_mitre_data_component_ref: 'data-component-1',
        name: 'perm-1',
        channel: 'perm-1',
      },
      {
        x_mitre_data_component_ref: 'data-component-2',
        name: 'perm-2',
        channel: 'perm-2',
      },
    ],
    x_mitre_mutable_elements: [
      {
        field: 'fieldOne',
        description: 'Description of fieldOne',
      },
      {
        field: 'fieldTwo',
        description: 'Description of fieldTwo',
      },
    ],
  },
};

const options = {
  prefix: 'x-mitre-analytic',
  baseUrl: '/api/analytics',
  label: 'Analytics',
};
const paginationTests = new PaginationTests(analyticsService, initialObjectData, options);
paginationTests.executeTests();
