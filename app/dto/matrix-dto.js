'use strict';

class MatrixDTO {
    constructor(data) {
        this.pagination = {
            total: data.total || 0,
            offset: data.offset || 0,
            limit: data.limit || 0
        };
        this.data = data.documents || [];
    }
}
module.exports = MatrixDTO;
