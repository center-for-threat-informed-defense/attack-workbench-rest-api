'use strict';

const express = require('express');

const validateController = require('../controllers/validate-controller');
const authn = require('../lib/authn-middleware');
const authz = require('../lib/authz-middleware');

const router = express.Router();

router
  .route('/validate')
  .post(authn.authenticate, authz.requireRole(authz.editorOrHigher), validateController.validate);

module.exports = router;
