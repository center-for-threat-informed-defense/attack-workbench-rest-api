'use strict';

const BaseRepository = require('./_base.repository');
const Matrix = require('../models/matrix-model');

class MatrixRepository extends BaseRepository {

    constructor() {
        super(Matrix);
        // this.model = Matrix;
    }
}

module.exports = new MatrixRepository();