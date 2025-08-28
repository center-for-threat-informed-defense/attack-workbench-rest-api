'use strict';

const analyticsRepository = require('../repository/analytics-repository');
const BaseService = require('./_base.service');
const { Analytic: AnalyticType } = require('../lib/types');

class AnalyticsService extends BaseService {}

module.exports = new AnalyticsService(AnalyticType, analyticsRepository);
