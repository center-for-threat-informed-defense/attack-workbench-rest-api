/* eslint-disable max-classes-per-file */
'use strict';

class CustomError extends Error {
    constructor(message, options = {}) {
        super(message);

        // Apply options (if defined) to the error object
        for (const key in options) {
            if (Object.prototype.hasOwnProperty.call(options, key)) {
                this[key] = options[key];
            }
        }
    }
}

class MissingParameterError extends CustomError {
    constructor(options) {
        super('Missing required parameter', options);
    }
}

class BadlyFormattedParameterError extends CustomError {
    constructor(options) {
        super('Badly formatted parameter', options);
    }
}

class DuplicateIdError extends CustomError {
    constructor(options) {
        super('Duplicate id', options);
    }
}

class NotFoundError extends CustomError {
    constructor(options) {
        super('Document not found', options);
    }
}

class InvalidQueryStringParameterError extends CustomError {
    constructor(options) {
        super('Invalid query string parameter', options);
    }
}

class IdentityServiceError extends CustomError {
    constructor(options) {
        super('An error occurred in the identities service.', options);
    }
}

class DocumentSaveError extends CustomError {
    constructor(options) {
        super('The database save operation failed.', options);)
    }
}

module.exports = {
    MissingParameterError,
    BadlyFormattedParameterError,
    DuplicateIdError,
    NotFoundError,
    InvalidQueryStringParameterError,
    IdentityServiceError,
    DocumentSaveError
};
