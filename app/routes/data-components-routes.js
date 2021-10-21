'use strict';

const express = require('express');
const dataComponentsController = require('../controllers/data-components-controller');

const router = express.Router();

router.route('/data-components')
    .get(dataComponentsController.retrieveAll)
    .post(dataComponentsController.create);

router.route('/data-components/:stixId')
    .get(dataComponentsController.retrieveById);

router.route('/data-components/:stixId/modified/:modified')
    .get(dataComponentsController.retrieveVersionById)
    .put(dataComponentsController.updateFull)
    //    .patch(dataComponentsController.updatePartial)
    .delete(dataComponentsController.delete);

module.exports = router;
