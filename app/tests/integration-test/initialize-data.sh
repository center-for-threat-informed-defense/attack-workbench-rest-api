#!/usr/bin/env bash

# Clear the test directories
rm -fv ./tests/integration-test/mock-remote-host/mock-data/collection-indexes/*.json
rm -fv ./tests/integration-test/mock-remote-host/mock-data/collection-bundles/*.json

# Copy the first set of files to the test directories
cp ./tests/integration-test/mock-data/collection-index-v1.json ./tests/integration-test/mock-remote-host/mock-data/collection-indexes/collection-index.json
cp ./tests/integration-test/mock-data/blue-v1.json ./tests/integration-test/mock-remote-host/mock-data/collection-bundles/

cd ./tests/integration-test
env WORKBENCH_AUTHN_APIKEY=ePcAssW9Ad9CUBghWCeW  node ./initialize-data.js
