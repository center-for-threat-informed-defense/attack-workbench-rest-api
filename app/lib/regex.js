'use strict';

exports.sanitizeRegex = function (expression) {
  // Compile the expression. If it's valid, return the expression. Otherwise, return an empty string.
  try {
    // Escapes all regex characters so they are treated like literal characters rather than special regex characters
    // eslint-disable-next-line no-useless-escape
    expression = expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // eslint-disable-next-line no-new
    new RegExp(expression);
    return expression;
  } catch (err) {
    return '';
  }
};
