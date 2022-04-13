'use strict';

const express = require('express');
const collectionIndexesController = require('../controllers/collection-indexes-controller');

const router = express.Router();

router.route('/collection-indexes')
    .get(
//        authnService.authenticate,
        collectionIndexesController.retrieveAll
    )
    .post(
//        authnService.authenticate,
        collectionIndexesController.create
    );

router.route('/collection-indexes/:id')
    .get(
//        authnService.authenticate,
        collectionIndexesController.retrieveById
    );

router.route('/collection-indexes/:id')
    .put(
//        authnService.authenticate,
        collectionIndexesController.updateFull
    )
    .delete(
//        authnService.authenticate,
        collectionIndexesController.delete
    );

module.exports = router;
