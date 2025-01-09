'use strict';

const Reference = require('../models/reference-model');
const { BadlyFormattedParameterError, DuplicateIdError, DatabaseError } = require('../exceptions');

class ReferencesRepository {
  constructor(model) {
    this.model = model;
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
    
        // Get the total count of documents, pre-limit
        const totalCount = await this.model.aggregate(aggregation).count("totalCount").exec();

        if (options.offset) {
            aggregation.push({ $skip: options.offset });
        }
        else {
            aggregation.push({ $skip: 0 });
        }

        if (options.limit) {
            aggregation.push({ $limit: options.limit });
        }

        // Retrieve the documents
        const documents = await this.model.aggregate(aggregation).exec();

        // Return data in the format previously given by $facet
        return [{
            totalCount: [{ totalCount: totalCount[0]?.totalCount || 0, }],
            documents: documents
        }]
    }
    
    async save(data) {
        // Create the document
        const reference = new this.model(data);
    
        // Save the document in the database
        try {
            const savedReference = await reference.save();
            return savedReference;
        }
        catch(err) {
            if (err.name === 'MongoServerError' && err.code === 11000) {
                // 11000 = Duplicate index
                throw new DuplicateIdError({
                    details: `Reference with source_name '${ data.source_name }' already exists.`
                });
            }
            else {
                throw new DatabaseError(err);
            }
        }
    }
    
    async updateAndSave(data) {
        try {
            const document = await this.model.findOne({ 'source_name': data.source_name }).exec();
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
                throw new BadlyFormattedParameterError({ parameterName: 'source_name' });
            }
            else {
                throw new DatabaseError(err);
            }
        }
    }

  async findOneAndRemove(sourceName) {
    try {
      return await this.model.findOneAndRemove({ source_name: sourceName }).exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new ReferencesRepository(Reference);
