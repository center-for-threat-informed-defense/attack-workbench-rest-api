#!/usr/bin/env bash

pwd

# Copy the next set of files to the test directories
cp ./tests/integration-test/mock-data/collection-index-v2.json ./tests/integration-test/mock-remote-host/mock-data/collection-indexes/collection-index.json
cp ./tests/integration-test/mock-data/blue-v2.json ./tests/integration-test/mock-remote-host/mock-data/collection-bundles/
cp ./tests/integration-test/mock-data/red-v1.json ./tests/integration-test/mock-remote-host/mock-data/collection-bundles/
cp ./tests/integration-test/mock-data/green-v1.json ./tests/integration-test/mock-remote-host/mock-data/collection-bundles/
