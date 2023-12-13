'use strict';

const BaseRepository = require('./_base.repository');
const Matrix = require('../models/matrix-model');

class MatrixRepository extends BaseRepository { }

module.exports = new MatrixRepository(Matrix);