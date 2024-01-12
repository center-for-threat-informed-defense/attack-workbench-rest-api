'use strict';

const BaseRepository = require('./_base.repository');
const MarkingDefinition = require('../models/marking-definition-model');

class MarkingDefinitionsRepository extends BaseRepository { }

module.exports = new MarkingDefinitionsRepository(MarkingDefinition);