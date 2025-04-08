const SystemConfiguration = require('../models/system-configuration-model');
const { DatabaseError } = require('../exceptions');

class SystemConfigurationsRepository {
  constructor(model) {
    this.model = model;
  }

  createNewDocument(data) {
    return new this.model(data);
  }

  static async saveDocument(document) {
    try {
      return await document.save();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async retrieveOne(options) {
    options = options ?? {};
    if (options.lean) {
      return await this.model.findOne().lean();
    } else {
      return await this.model.findOne();
    }
  }
}

module.exports = new SystemConfigurationsRepository(SystemConfiguration);
