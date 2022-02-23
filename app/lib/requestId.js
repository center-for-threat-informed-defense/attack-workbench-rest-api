'use strict';

const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const idGenerator = customAlphabet(alphabet, 12);

module.exports = function (req, res, next) {
        req.id =  idGenerator();
        next();
}
