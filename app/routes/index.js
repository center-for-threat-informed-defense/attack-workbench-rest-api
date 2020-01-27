'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

// Parse the request body
router.use('/api', bodyParser.json({limit: '1mb'}));
router.use('/api', bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Set up the routes
// TODO:

// Handle errors that haven't otherwise been caught
// TODO:

module.exports = router;
