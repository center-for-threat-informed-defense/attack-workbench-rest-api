#!/usr/bin/env bash

find $1 -maxdepth 1 -type f -name '*.spec.js' -exec npx mocha --timeout 10000 {} \;
