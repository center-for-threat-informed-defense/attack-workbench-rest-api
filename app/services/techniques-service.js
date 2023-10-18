'use strict';

const util = require('util');

const Technique = require('../models/technique-model');
const config = require('../config/config');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');
const { BadlyFormattedParameterError } = require('../exceptions');

const errors = {
    missingParameter: 'Missing required parameter',
    badlyFormattedParameter: 'Badly formatted parameter',
    duplicateId: 'Duplicate id',
    notFound: 'Document not found',
    invalidQueryStringParameter: 'Invalid query string parameter'
};
exports.errors = errors;

const techniquesRepository = require('../repository/matrix-repository');

const BaseService = require('./_base.service');

class TechniquesService extends BaseService {

    constructor() {
        super(techniquesRepository, Technique);

        this.retrieveAllTactics = null;
    }

    static tacticMatchesTechnique(technique) {
        return function(tactic) {
            // A tactic matches if the technique has a kill chain phase such that:
            //   1. The phase's kill_chain_name matches one of the tactic's kill chain names (which are derived from the tactic's x_mitre_domains)
            //   2. The phase's phase_name matches the tactic's x_mitre_shortname

            // Convert the tactic's domain names to kill chain names
            const tacticKillChainNames = tactic.stix.x_mitre_domains.map(domain => config.domainToKillChainMap[domain]);
            return technique.stix.kill_chain_phases.some(phase => phase.phase_name === tactic.stix.x_mitre_shortname && tacticKillChainNames.includes(phase.kill_chain_name));
        }
    }

    static getPageOfData(data, options) {
        const startPos = options.offset;
        const endPos = (options.limit === 0) ? data.length : Math.min(options.offset + options.limit, data.length);

        return data.slice(startPos, endPos);
    }


    async retrieveTacticsForTechnique(stixId, modified, options) {
        // Late binding to avoid circular dependency between modules
        if (!this.retrieveAllTactics) {
            const tacticsService = require('./tactics-service');
            this.retrieveAllTactics = util.promisify(tacticsService.retrieveAll);
        }

        // Retrieve the tactics associated with the technique (the technique identified by stixId and modified date)
        if (!stixId) {
            const error = new Error(errors.missingParameter);
            error.parameterName = 'stixId';
            throw error;
        }

        if (!modified) {
            const error = new Error(errors.missingParameter);
            error.parameterName = 'modified';
            throw error;
        }

        try {
            const technique = await Technique.findOne({ 'stix.id': stixId, 'stix.modified': modified });
            if (!technique) {
                // Note: document is null if not found
                return null;
            }
            else {
                const allTactics = await retrieveAllTactics({});
                const filteredTactics = await allTactics.filter(tacticMatchesTechnique(technique));
                const pagedResults = await getPageOfData(filteredTactics, options);

                if (options.includePagination) {
                    const returnValue = {
                        pagination: {
                            total: pagedResults.length,
                            offset: options.offset,
                            limit: options.limit
                        },
                        data: pagedResults
                    };
                    return returnValue;
                }
                else {
                    return pagedResults;
                }
            }
        }
        catch(err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            }
            else {
                throw err;
            }
        }
    };

}
module.exports = new TechniquesService();