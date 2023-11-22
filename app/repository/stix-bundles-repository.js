'use strict';

const BaseRepository = require('./_base.repository');
const Matrix = require('../models/matrix-model');

class StixBundlesRepository extends BaseRepository { }

module.exports = new StixBundlesRepository(Matrix);