/* eslint-disable no-unused-vars */
// Note there is a bug in eslint where single line comment will not work ^
'use strict';

const { NotImplementedError } = require('../exceptions');

class AbstractService {
  retrieveAll(options) {
    throw new NotImplementedError(this.constructor.name, 'retrieveAll');
  }

  retrieveById(stixId, options) {
    throw new NotImplementedError(this.constructor.name, 'retrieveById');
  }

  retrieveVersionById(stixId, modified) {
    throw new NotImplementedError(this.constructor.name, 'retrieveVersionById');
  }

  create(data, options) {
    throw new NotImplementedError(this.constructor.name, 'create');
  }

  // ... other abstract methods ...
}

module.exports = AbstractService;
