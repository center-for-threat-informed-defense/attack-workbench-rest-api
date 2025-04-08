'use strict';

const mongoose = require('mongoose');

// Create the definition
const teamDefinition = {
  id: {
    type: String,
    index: {
      unique: true,
    },
  },
  name: { type: String, required: true, unique: true },
  description: { type: String },
  userIDs: [String],
  created: { type: Date, required: true },
  modified: { type: Date, required: true },
};

// Create the schema
const teamSchema = new mongoose.Schema(teamDefinition, { bufferCommands: false });

// Create the model
const TeamModel = mongoose.model('Team', teamSchema);

module.exports = TeamModel;
