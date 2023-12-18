'use strict';

const BaseRepository = require('./_base.repository');
const MarkingDefinition = require('../models/marking-definition-model');

class MarkingDefinitionRepository extends BaseRepository { }

module.exports = new MarkingDefinitionRepository(MarkingDefinition);