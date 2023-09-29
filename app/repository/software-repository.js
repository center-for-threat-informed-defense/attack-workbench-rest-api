'use strict';

const BaseRepository = require('./_base.repository');
const Software = require('../models/software-model');

class SoftwareRepository extends BaseRepository {

    constructor() {
        super(Software);
    }
}

module.exports = new SoftwareRepository();