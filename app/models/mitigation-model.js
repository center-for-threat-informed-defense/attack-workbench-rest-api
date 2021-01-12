'use strict';

const mongoose = require('mongoose');
const AttackObject = require('./attack-object-model');
const courseOfActionDefinitions = require('./subschemas/course-of-action');

// Create the definition
const courseOfActionDefinition = {
    stix: {
        ...courseOfActionDefinitions.courseOfAction
    }
};

// Create the schema
const courseOfActionSchema = new mongoose.Schema(courseOfActionDefinition);

// Create the model
const CourseOfActionModel = AttackObject.discriminator('Course-of-Action', courseOfActionSchema);

module.exports = CourseOfActionModel;

