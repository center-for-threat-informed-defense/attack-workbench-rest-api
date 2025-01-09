'use strict';

const BaseRepository = require('./_base.repository');
const Identity = require('../models/identity-model');

class IdentitiesRepository extends BaseRepository {}

module.exports = new IdentitiesRepository(Identity);
