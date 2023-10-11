'use strict';


const util = require('util');

const Tactic = require('../models/tactic-model');
const config = require('../config/config');
const {lastUpdatedByQueryHelper} = require('../lib/request-parameter-helper');

const { BadlyFormattedParameterError, DuplicateIdError, NotFoundError, InvalidQueryStringParameterError, MissingParameterError } = require('../exceptions');

const BaseService = require('./_base.service');
const TacticsRepository = require('../repository/tactics-repository');

class TacticsService extends BaseService {
    constructor () {
        super(TacticsRepository, Tactic);
        this.retrieveAllTechniques = null;
    }

    async techniqueMatchesTactic(tactic) {
        return async function(technique) {
            // A tactic matches if the technique has a kill chain phase such that:
            //   1. The phase's kill_chain_name matches one of the tactic's kill chain names (which are derived from the tactic's x_mitre_domains)
            //   2. The phase's phase_name matches the tactic's x_mitre_shortname
    // Build the aggregation
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the first document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
        const aggregation = [
            { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
            { $group: { _id: '$stix.id', document: { $first: '$$ROOT' }}},
            { $replaceRoot: { newRoot: '$document' }},
            { $sort: { 'stix.id': 1 }},
            { $match: query }
        ];

            // Convert the tactic's domain names to kill chain names
            const tacticKillChainNames = tactic.stix.x_mitre_domains.map(domain => config.domainToKillChainMap[domain]);
            return technique.stix.kill_chain_phases.some(phase => phase.phase_name === tactic.stix.x_mitre_shortname && tacticKillChainNames.includes(phase.kill_chain_name));
        }
    }

    async getPageOfData(data, options) {
        const startPos = options.offset;
        const endPos = (options.limit === 0) ? data.length : Math.min(options.offset + options.limit, data.length);

        return data.slice(startPos, endPos);
    }

    async retrieveTechniquesForTactic (stixId, modified, options) {
        // Late binding to avoid circular dependency between modules
        if (!this.retrieveAllTechniques) {
            const techniquesService = require('./techniques-service');
            retrieveAllTechniques = util.promisify(techniquesService.retrieveAll);
        }

        // Retrieve the techniques associated with the tactic (the tactic identified by stixId and modified date)
        if (!stixId) {
            throw new MissingParameterError({ parameterName: 'stixId' });
        }

        if (!modified) {
            throw new MissingParameterError({ parameterName: 'modified' });
        }

        try {
            const tactic = await Tactic.findOne({ 'stix.id': stixId, 'stix.modified': modified });

            // Note: document is null if not found
            if (!tactic) {
                return null;
            }
            else {
                const allTechniques = await retrieveAllTechniques({});
                const filteredTechniques = allTechniques.filter(techniqueMatchesTactic(tactic));
                const pagedResults = getPageOfData(filteredTechniques, options);

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
                throw new BadlyFormattedParameterError({ parameterName: 'stixId' });
            }
            else {
                throw err;
            }
        }
    }

}

module.exports = new TacticsService();