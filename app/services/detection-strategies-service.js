'use strict';

const detectionStrategiesRepository = require('../repository/detection-strategies-repository');
const BaseService = require('./_base.service');
const { DetectionStrategy: DetectionStrategyType } = require('../lib/types');

class DetectionStrategiesService extends BaseService {}

module.exports = new DetectionStrategiesService(
  DetectionStrategyType,
  detectionStrategiesRepository,
);
