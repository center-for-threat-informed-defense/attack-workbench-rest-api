'use strict';

const BaseRepository = require('./_base.repository');
const Group = require('../models/group-model');

class GroupsRepository extends BaseRepository {

    constructor() {
        super(Group);

    }
}

module.exports = new GroupsRepository();