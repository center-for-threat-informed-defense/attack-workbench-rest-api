'use strict';

exports.paginate = function (options, results) {
    if (options.includePagination) {
        let derivedTotalCount = 0;
        if (results[0].totalCount && results[0].totalCount.length > 0) {
            derivedTotalCount = results[0].totalCount[0].totalCount;
        }
        return {
            pagination: {
                total: derivedTotalCount,
                offset: options.offset,
                limit: options.limit
            },
            data: results[0].documents
        };
    } else {
        return results[0].documents;
    }
};