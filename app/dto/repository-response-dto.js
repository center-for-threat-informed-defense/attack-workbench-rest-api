'use strict';

class RepositoryResponseDTO {
    constructor(data) {
        this.totalCount = data.totalCount || [];
        this.documents = data.documents || [];
    }
}
module.exports = RepositoryResponseDTO;