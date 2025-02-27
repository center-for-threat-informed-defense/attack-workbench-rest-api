'use strict';

const { NotImplementedError } = require('../exceptions');

class AbstractService {
  // eslint-disable-next-line no-unused-vars
  retrieveAll(options) {
    throw new NotImplementedError(this.constructor.name, 'retrieveAll');
  }

  // eslint-disable-next-line no-unused-vars
  retrieveById(stixId, options) {
    throw new NotImplementedError(this.constructor.name, 'retrieveById');
  }

  // eslint-disable-next-line no-unused-vars
  retrieveVersionById(stixId, modified) {
    throw new NotImplementedError(this.constructor.name, 'retrieveVersionById');
  }

  // eslint-disable-next-line no-unused-vars
  create(data, options) {
    throw new NotImplementedError(this.constructor.name, 'create');
  }

  // ... other abstract methods ...
}

module.exports = AbstractService;
