'use strict';

const BaseRepository = require('./_base.repository');
const Analytic = require('../models/analytic-model');

class AnalyticsRepository extends BaseRepository {}

module.exports = new AnalyticsRepository(Analytic);
