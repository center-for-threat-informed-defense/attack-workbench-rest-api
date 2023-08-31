const UserAccount = require('../models/user-account-model');
const regexValidator = require('../lib/regex');

exports.retrieveAll = function (options) {

    // Build the query
    const query = {};
    if (typeof options.status !== 'undefined') {
        if (Array.isArray(options.status)) {
            query['status'] = { $in: options.status };
        }
        else {
            query['status'] = options.status;
        }
    }

    if (typeof options.role !== 'undefined') {
        if (Array.isArray(options.role)) {
            query['role'] = { $in: options.role };
        }
        else {
            query['role'] = options.role;
        }
    }

    // Build the aggregation
    // - Then apply query, skip, and limit options
    const aggregation = [
        { $sort: { 'username': 1 } },
        { $match: query }
    ];

    if (typeof options.search !== 'undefined') {
        options.search = regexValidator.sanitizeRegex(options.search);
        const match = {
            $match: {
                $or: [
                    { 'username': { '$regex': options.search, '$options': 'i' } },
                    { 'email': { '$regex': options.search, '$options': 'i' } },
                    { 'displayName': { '$regex': options.search, '$options': 'i' } }
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
    return UserAccount.aggregate(aggregation).exec();
};

exports.findOneById = function (userAccountId) {
    // Note: The .lean().exec() parts are used in Mongoose for converting the returned document to a plain JavaScript object. 
    // If you're not using Mongoose, you might not need them.
    return UserAccount.findOne({ 'id': userAccountId }).lean().exec();
};

exports.findOneByEmail = function (email) {
    return UserAccount.findOne({ 'email': email }).lean().exec();
};

exports.findByEmail = function (email) {
    return UserAccount.findOne({ 'email': email }).lean().exec();
};

exports.save = function (userAccountData) {
    const userAccount = new UserAccount(userAccountData);
    return userAccount.save();
};

exports.updateById = async function (userAccountId, data) {
    const document = await UserAccount.findOne({ 'id': userAccountId });

    if (!document) {
        // document not found
        return null;
    }

    // Copy data to found document
    document.email = data.email;
    document.username = data.username;
    document.displayName = data.displayName;
    document.status = data.status;
    document.role = data.role;

    // Set the modified timestamp
    document.modified = new Date().toISOString();

    // Save and return the document
    return document.save();
};

exports.removeById = function (userAccountId) {
    return UserAccount.findOneAndRemove({ 'id': userAccountId }).exec();
};