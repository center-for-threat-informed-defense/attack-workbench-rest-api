'use strict';

const BaseRepository = require('./_base.repository');
const Software = require('../models/software-model');

class SoftwareRepository extends BaseRepository {

}

module.exports = new SoftwareRepository(Software);