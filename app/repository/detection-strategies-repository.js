'use strict';

const BaseRepository = require('./_base.repository');
const DetectionStrategy = require('../models/detection-strategy-model');

class DetectionStrategiesRepository extends BaseRepository {}

module.exports = new DetectionStrategiesRepository(DetectionStrategy);
