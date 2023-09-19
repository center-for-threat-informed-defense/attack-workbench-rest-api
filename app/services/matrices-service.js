'use strict';

const util = require('util');
const Matrix = require('../models/matrix-model');
const MatrixRepository = require('../repository/matrix-repository');
const logger = require('../lib/logger');
const { GenericServiceError,
    MissingParameterError } = require('../exceptions');

const BaseService = require('./_base.service');

class MatrixService extends BaseService {

    constructor() {
        super(MatrixRepository, Matrix);

        this.retrieveTacticById = null;
        this.retrieveTechniquesForTactic = null;
    }

    // Custom methods specific to MatrixService should be specified below

    async retrieveTechniquesForMatrix(stixId, modified) {
    // Lazy loading of services
        if (!this.retrieveTacticById || !this.retrieveTechniquesForTactic) {
            const tacticsService = require('./tactics-service');
            this.retrieveTacticById = util.promisify(tacticsService.retrieveById);
            this.retrieveTechniquesForTactic = tacticsService.retrieveTechniquesForTactic;
        }

        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }
        if (!modified) {
            throw new MissingParameterError({ parameterName: 'modified' });
        }

        let matrix;
        try {
            matrix = await MatrixRepository.retrieveOneByVersion(stixId, modified);
        } catch (err) {
            logger.error('Failed during matrix retrieval by version and ID.');
            throw err; // Let the DatabaseError bubble up
        }

        if (!matrix) {
            // TODO determine if we should throw an error here instead of returning null
            // throw new NotFoundError({ ... });
            return null;
        }

        const options = { versions: 'latest', offset: 0, limit: 0 };
        const tacticsTechniques = {};

        for (const tacticId of matrix.stix.tactic_refs) {
            let tactics, techniques;
            try {
                tactics = await this.retrieveTacticById(tacticId, options);
                if (tactics && tactics.length) {
                    techniques = await this.retrieveTechniquesForTactic(tacticId, tactics[0].stix.modified, options);
                }
            } catch (err) {
                logger.error('Error while retrieving tactics or techniques.');
                throw new GenericServiceError(err); // TODO it's probably better to throw TechniquesServiceError or TacticsServiceError
            }

            if (tactics && tactics.length) {
                const tactic = tactics[0];
                const parentTechniques = [];
                const subtechniques = [];

                for (const technique of techniques) {
                    if (!technique.stix.x_mitre_is_subtechnique) {
                        parentTechniques.push(technique);
                    } else {
                        subtechniques.push(technique);
                    }
                }

                for (const parentTechnique of parentTechniques) {
                    parentTechnique.subtechniques = [];
                    for (const subtechnique of subtechniques) {
                        if (subtechnique.workspace.attack_id.split(".")[0] === parentTechnique.workspace.attack_id) {
                            parentTechnique.subtechniques.push(subtechnique);
                        }
                    }
                }
                tactic.techniques = parentTechniques;
                tacticsTechniques[tactic.stix.name] = tactic;
            }
        }

        return tacticsTechniques;
    }
}

module.exports = new MatrixService();