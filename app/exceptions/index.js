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

class TechniquesServiceError extends CustomError {
    constructor(options) {
        super('An error occurred in the techniques service.', options);
    }
}

class TacticsServiceError extends CustomError {
    constructor(options) {
        super('An error occurred in the tactics service.', options);
    }
}

class GenericServiceError extends CustomError {
    constructor(options) {
        super('An error occurred in a service.', options);
    }
}

class DatabaseError extends CustomError {
    constructor(options) {
        super('The database operation failed.', options);
    }
}

class NotImplementedError extends CustomError {
    constructor(moduleName, functionName, options) {
        super(`The function ${functionName} in module ${moduleName} is not implemented!`, options);

    }
}

class InvalidTypeError extends CustomError {
    constructor(options) {
<<<<<<< HEAD
        super('Unable to create campaign. stix.type must be campaign', options);
=======
        super('Invalid stix.type', options);
>>>>>>> project-orion
    }
}

module.exports = {

    //** General errors */
    NotImplementedError,
    
    //** User-related errors */
    MissingParameterError,
    BadlyFormattedParameterError,
    InvalidQueryStringParameterError,
    
    //** Database-related errors */
    DuplicateIdError,
    NotFoundError,
    DatabaseError,
    
    /** Service-specific errors */
    GenericServiceError,
    IdentityServiceError,
    TechniquesServiceError,
    TacticsServiceError,
    InvalidTypeError,
};
