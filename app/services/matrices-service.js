'use strict';

const util = require('util');

const BaseService = require('./_base.service');
const matrixRepository = require('../repository/matrix-repository');
const { Matrix: MatrixType } = require('../lib/types');

const { GenericServiceError, MissingParameterError } = require('../exceptions');

class MatrixService extends BaseService {
  constructor(type, repository) {
    super(type, repository);

    this.retrieveTacticById = null;
    this.retrieveTechniquesForTactic = null;
  }

  // Custom methods specific to MatrixService should be specified below

  async retrieveTechniquesForMatrix(stixId, modified, callback) {
    if (BaseService.isCallback(arguments[arguments.length - 1])) {
      callback = arguments[arguments.length - 1];
    }

    // Lazy loading of services
    if (!this.retrieveTacticById || !this.retrieveTechniquesForTactic) {
      const tacticsService = require('./tactics-service');
      this.retrieveTacticById = util.promisify(tacticsService.retrieveById);
      this.retrieveTechniquesForTactic = tacticsService.retrieveTechniquesForTactic;
    }

    if (!stixId) {
      const err = new MissingParameterError({ parameterName: 'stixId' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    if (!modified) {
      const err = new MissingParameterError({ parameterName: 'modified' });
      if (callback) {
        return callback(err);
      }
      throw err;
    }

    let matrix;
    try {
      matrix = await matrixRepository.retrieveOneByVersion(stixId, modified);
    } catch (err) {
      if (callback) {
        return callback(err);
      }
      throw err; // Let the DatabaseError bubble up
    }

    if (!matrix) {
      if (callback) {
        return callback(null, null);
      }
      return null;
    }

    const options = { versions: 'latest', offset: 0, limit: 0 };
    const tacticsTechniques = {};

    for (const tacticId of matrix.stix.tactic_refs) {
      let tactics, techniques;
      try {
        tactics = await this.retrieveTacticById(tacticId, options);
        if (tactics && tactics.length) {
          techniques = await this.retrieveTechniquesForTactic(
            tacticId,
            tactics[0].stix.modified,
            options,
          );
        }
      } catch (err) {
        const genericServiceError = new GenericServiceError(err); // TODO it's probably better to throw TechniquesServiceError or TacticsServiceError
        if (callback) {
          return callback(genericServiceError);
        }
        throw genericServiceError;
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
            if (
              subtechnique.workspace.attack_id.split('.')[0] === parentTechnique.workspace.attack_id
            ) {
              parentTechnique.subtechniques.push(subtechnique);
            }
          }
        }
        tactic.techniques = parentTechniques;
        tacticsTechniques[tactic.stix.name] = tactic;
      }
    }
    if (callback) {
      return callback(null, tacticsTechniques);
    }
    return tacticsTechniques;
  }
}

module.exports = new MatrixService(MatrixType, matrixRepository);
