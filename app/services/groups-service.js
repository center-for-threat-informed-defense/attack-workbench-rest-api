'use strict';

const BaseService = require('./_base.service');
const groupsRepository = require('../repository/groups-repository');
const { InvalidTypeError } = require('../exceptions');

class GroupsService extends BaseService {

    createGroup(data, options) {

        // Overrides the base method for groups to inject an additional 
        // logic check to verify that the creation request is not for an
        // intrusion-set, which is an unsupported/invalid use case.  

        if (data.stix.type !== 'intrusion-set') {
            throw new InvalidTypeError();
        }
        return this.create(data, options);
    }
}

module.exports = new GroupsService(groupsRepository);