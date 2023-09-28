'use strict';

const AbstractRepository = require('./_abstract.repository');
const regexValidator = require('../lib/regex');
const { lastUpdatedByQueryHelper } = require('../lib/request-parameter-helper');
const { DatabaseError, DuplicateIdError, BadlyFormattedParameterError } = require('../exceptions');

class BaseRepository extends AbstractRepository {
    constructor(model) {
        super();
        this.model = model;
    }

    async retrieveAll(options) {
        try {
            // Build the query
            const query = {};

            // Build the query
            if (!options.includeRevoked) {
                query['stix.revoked'] = { $in: [null, false] };
            }
            if (!options.includeDeprecated) {
                query['stix.x_mitre_deprecated'] = { $in: [null, false] };
            }
            if (typeof options.state !== 'undefined') {
                if (Array.isArray(options.state)) {
                    query['workspace.workflow.state'] = { $in: options.state };
                }
                else {
                    query['workspace.workflow.state'] = options.state;
                }
            }
            if (typeof options.lastUpdatedBy !== 'undefined') {
                query['workspace.workflow.created_by_user_account'] = lastUpdatedByQueryHelper(options.lastUpdatedBy);
            }

            // Build the aggregation
            // - Group the documents by stix.id, sorted by stix.modified
            // - Use the first document in each group (according to the value of stix.modified)
            // - Then apply query, skip and limit options
            const aggregation = [
                { $sort: { 'stix.id': 1, 'stix.modified': -1 } },
                { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
                { $replaceRoot: { newRoot: '$document' } },
                { $sort: { 'stix.id': 1 } },
                { $match: query }
            ];

            if (typeof options.search !== 'undefined') {
                options.search = regexValidator.sanitizeRegex(options.search);
                const match = {
                    $match: {
                        $or: [
                            { 'stix.name': { '$regex': options.search, '$options': 'i' } },
                            { 'stix.description': { '$regex': options.search, '$options': 'i' } }
                        ]
                    }
                };
                aggregation.push(match);
            }

            const facet = {
                $facet: {
                    totalCount: [{ $count: 'totalCount' }],
                    documents: []
                }
            };
            if (options.offset) {
                facet.$facet.documents.push({ $skip: options.offset });
            }
            else {
                facet.$facet.documents.push({ $skip: 0 });
            }
            if (options.limit) {
                facet.$facet.documents.push({ $limit: options.limit });
            }
            aggregation.push(facet);

            // Retrieve the documents
            return await this.model.aggregate(aggregation).exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async retrieveOneById(stixId) {
        try {
            return await this.model.findOne({ 'stix.id': stixId }).exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async retrieveAllById(stixId) {
        try {
            return await this.model.find({ 'stix.id': stixId })
                .sort('-stix.modified')
                .lean()
                .exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async retrieveLatestByStixId(stixId) {
        try {
            return await this.model.findOne({ 'stix.id': stixId })
                .sort('-stix.modified')
                .lean()
                .exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async retrieveOneByVersion(stixId, modified) {
        try {
            return await this.model.findOne({ 'stix.id': stixId, 'stix.modified': modified })
                .exec();
        } catch (err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError({ parameterName: 'stixId' });
            } else if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError();
            }
            throw new DatabaseError(err);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    async save(data) {

        try {
            const document = new this.model(data);
            return await document.save();
        } catch (err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                throw new DuplicateIdError({
                    details: `Document with id '${data.stix.id}' already exists.`
                });
            }
            throw new DatabaseError(err);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    async updateAndSave(document, data) {
        try {
            Object.assign(document, data);
            return await document.save();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async findOneAndRemove(stixId, modified) {
        try {
            return await this.model.findOneAndRemove({ 'stix.id': stixId, 'stix.modified': modified }).exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async deleteMany(stixId) {
        try {
            return await this.model.deleteMany({ 'stix.id': stixId }).exec();
        } catch (err) {
            throw new DatabaseError(err);
        }
    }
    
}

module.exports = BaseRepository;
