'use strict';

const BaseRepository = require('./_base.repository');
const AttackObject = require('../models/attack-object-model');
const Relationship = require('../models/relationship-model');

class RecentActivityRepository extends BaseRepository {

    constructor() {
        super(Relationship);
        this.AttackObj = AttackObject;
    }
}

module.exports = new RecentActivityRepository();