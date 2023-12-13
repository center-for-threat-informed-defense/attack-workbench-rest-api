'use strict';

const Reference = require('../models/reference-model');

// const ReferenceRepository = require('../repository/references-repository');

const { DuplicateIdError, BadlyFormattedParameterError, MissingParameterError } = require('../exceptions');

class ReferencesService {

    constructor() {
        this.model = Reference;
    }

    async retrieveAll(options) {
        // Build the text search
        let textSearch;
        if (typeof options.search !== 'undefined') {
            textSearch = { $text: { $search: options.search }};
        }
    
        // Build the query
        const query = {};
        if (typeof options.sourceName !== 'undefined') {
            query['source_name'] = options.sourceName;
        }
    
        // Build the aggregation
        const aggregation = [];
        if (textSearch) {
            aggregation.push({ $match: textSearch });
        }
    
        aggregation.push({ $sort: { 'source_name': 1 }});
        aggregation.push({ $match: query });
    
        const facet = {
            $facet: {
                totalCount: [ { $count: 'totalCount' }],
                documents: [ ]
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
        const results = await Reference.aggregate(aggregation);
    
        if (options.includePagination) {
            let derivedTotalCount = 0;
            if (results[0].totalCount.length > 0) {
                derivedTotalCount = results[0].totalCount[0].totalCount;
            }
            const returnValue = {
                pagination: {
                    total: derivedTotalCount,
                    offset: options.offset,
                    limit: options.limit
                },
                data: results[0].documents
            };
            return returnValue;
        }
        else {
            return results[0].documents;
        }
    }
    
    async create(data) {
        // Create the document
        const reference = new Reference(data);
    
        // Save the document in the database
        try {
            const savedReference = await reference.save();
            return savedReference;
        }
        catch(err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                throw new DuplicateIdError;
            } else {
                console.log(`name: ${err.name} code: ${err.code}`);
                throw err;
            }
        }
    }
    
    async update(data) {
        // Note: source_name is used as the key and cannot be updated
        if (!data.source_name) {
            throw new MissingParameterError;
        }
    
        try {
            const document = await Reference.findOne({ 'source_name': data.source_name });
            if (!document) {
                // document not found
                return null;
            }
            else {
                // Copy data to found document and save
                Object.assign(document, data);
                const savedDocument = await document.save();
                return savedDocument;
            }
        }
        catch(err) {
            if (err.name === 'CastError') {
                throw new BadlyFormattedParameterError;
            }
            else  if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                throw new DuplicateIdError;
            } else {
                throw err;
            }
        }
    }

    async deleteBySourceName(sourceName) {
        if (!sourceName) {
            throw new MissingParameterError;
        }

        const deletedReference = await this.model.findOneAndRemove({ 'source_name': sourceName });
        return deletedReference;
    }

}

module.exports = new ReferencesService();