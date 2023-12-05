'use strict';

const BaseService = require('./_base.service');
const groupsRepository = require('../repository/groups-repository');

class GroupsService extends BaseService { }

module.exports = new GroupsService('intrusion-set', groupsRepository);