'use strict';

const express = require('express');
const collectionIndexesController = require('../controllers/collection-indexes-controller');

const router = express.Router();

router.route('/collection-indexes')
    .get(collectionIndexesController.retrieveAll)
    .post(collectionIndexesController.create);

router.route('/collection-indexes/:id')
    .get(collectionIndexesController.retrieveById);

router.route('/collection-indexes/:id')
    .put(collectionIndexesController.updateFull)
    //    .patch(collectionIndexesController.updatePartial)
    .delete(collectionIndexesController.delete);

module.exports = router;
