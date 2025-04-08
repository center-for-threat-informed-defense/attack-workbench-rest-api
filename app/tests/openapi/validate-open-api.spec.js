const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const refParser = require('@apidevtools/json-schema-ref-parser');
const config = require('../../config/config');
const { expect } = require('expect');

const validator = new OpenAPISchemaValidator({ version: 3 });

describe('OpenAPI Spec Validation', function () {
  it('The OpenAPI spec should exist', async function () {
    const openApiDoc = await refParser.dereference(config.openApi.specPath);
    expect(openApiDoc).toBeDefined();
  });

  it('The OpenAPI spec should be valid', async function () {
    const openApiDoc = await refParser.dereference(config.openApi.specPath);
    const results = validator.validate(openApiDoc);

    expect(results).toBeDefined();
    expect(results.errors).toBeDefined();
    expect(results.errors.length).toBe(0);
  });
});
