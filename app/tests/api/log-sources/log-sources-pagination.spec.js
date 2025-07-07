const logSourcesService = require('../../../services/log-sources-service');
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
    name: 'log-source-1',
    spec_version: '2.1',
    type: 'x-mitre-log-source',
    external_references: [{ source_name: 'mitre-attack', external_id: 'LS9999', url: "https://attack.mitre.org/log-sources/LS9999" }],
    object_marking_refs: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
    labels: ['label1', 'label2'],
    x_mitre_version: '1.0',
    x_mitre_attack_spec_version: '4.0.0',
    x_mitre_log_source_permutations: [
      {
        name: "perm-1",
        channel: "channel-1",
      },
      {
        name: "perm-2",
        channel: "channel-2",
      }
    ]
  },
};

const options = {
  prefix: 'x-mitre-log-source',
  baseUrl: '/api/log-sources',
  label: 'Log Sources',
};
const paginationTests = new PaginationTests(logSourcesService, initialObjectData, options);
paginationTests.executeTests();
