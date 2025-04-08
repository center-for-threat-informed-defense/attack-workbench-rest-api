'use strict';

//** import repositories */
const attackObjectsRepository = require('../repository/attack-objects-repository');
const identitiesRepository = require('../repository/identities-repository');
const relationshipsRepository = require('../repository/relationships-repository');

//** imports services */
const AttackObjectsService = require('./attack-objects-service');
const { IdentitiesService } = require('./identities-service');
const RelationshipsService = require('./relationships-service');

//** import types */
const { Identity: IdentityType, Relationship: RelationshipType } = require('../lib/types');

// ** initialize services */
const identitiesService = new IdentitiesService(IdentityType, identitiesRepository);
const relationshipsService = new RelationshipsService(RelationshipType, relationshipsRepository);
const attackObjectsService = new AttackObjectsService(
  attackObjectsRepository,
  identitiesService,
  relationshipsService,
);

module.exports = {
  identitiesService,
  relationshipsService,
  attackObjectsService,
};
