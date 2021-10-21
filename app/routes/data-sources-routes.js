'use strict';

const express = require('express');
const dataSourcesController = require('../controllers/data-sources-controller');

const router = express.Router();

router.route('/data-sources')
    .get(dataSourcesController.retrieveAll)
    .post(dataSourcesController.create);

router.route('/data-sources/:stixId')
    .get(dataSourcesController.retrieveById);

router.route('/data-sources/:stixId/modified/:modified')
    .get(dataSourcesController.retrieveVersionById)
    .put(dataSourcesController.updateFull)
    //    .patch(dataSourcesController.updatePartial)
    .delete(dataSourcesController.delete);

module.exports = router;
