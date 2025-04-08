'use strict';

const BaseService = require('./_base.service');
const groupsRepository = require('../repository/groups-repository');
const { Group: GroupType } = require('../lib/types');

class GroupsService extends BaseService {}

module.exports = new GroupsService(GroupType, groupsRepository);
