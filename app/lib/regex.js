'use strict';

exports.sanitizeRegex = function(expression) {
    // Compile the expression. If it's valid, return the expression. Otherwise, return an empty string.
    try {
        // eslint-disable-next-line no-new
        new RegExp(expression);
        return expression;
    }
    catch(err) {
        return '';
    }
}
