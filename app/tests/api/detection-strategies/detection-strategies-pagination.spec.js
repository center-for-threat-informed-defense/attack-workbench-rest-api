const detectionStrategiesService = require('../../../services/detection-strategies-service');
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
    name: 'detection-strategy-1',
    spec_version: '2.1',
    type: 'x-mitre-detection-strategy',
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'DET9999',
        url: 'https://attack.mitre.org/detection-strategies/DET9999',
      },
    ],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '4.0.0',
    x_mitre_domains: ['enterprise-attack'],
    x_mitre_analytics: [
      'x-mitre-analytic--12345678-1234-1234-1234-123456789000',
      'x-mitre-analytic--12345678-1234-1234-1234-123456789012',
    ],
  },
};

const options = {
  prefix: 'x-mitre-detection-strategy',
  baseUrl: '/api/detection-strategies',
  label: 'Detection Strategies',
};
const paginationTests = new PaginationTests(detectionStrategiesService, initialObjectData, options);
paginationTests.executeTests();
