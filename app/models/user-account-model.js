'use strict';

const mongoose = require('mongoose');

// Create the definition
const userAccountDefinition = {
  id: { type: String, required: true },
  email: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } },
    },
  },
  username: { type: String, required: true },
  displayName: { type: String },
  status: { type: String, required: true },
  role: { type: String },
  created: { type: Date, required: true },
  modified: { type: Date, required: true },
};

// Create the schema
const userAccountSchema = new mongoose.Schema(userAccountDefinition, { bufferCommands: false });

// Create the model
const UserAccountModel = mongoose.model('UserAccount', userAccountSchema);

module.exports = UserAccountModel;
