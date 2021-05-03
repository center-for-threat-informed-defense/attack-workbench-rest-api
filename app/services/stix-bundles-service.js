'use strict';

/* eslint-disable no-await-in-loop */

const uuid = require('uuid');

const AttackObject = require('../models/attack-object-model');
const Group = require('../models/group-model');
const Matrix = require('../models/matrix-model');
const Mitigation = require('../models/mitigation-model');
const Note = require('../models/note-model');
const Relationship = require('../models/relationship-model');
const Software = require('../models/software-model');
const Tactic = require('../models/tactic-model');
const Technique = require('../models/technique-model');

const errors = {
    notFound: 'Domain not found',
};
exports.errors = errors;

async function getAttackObject(stixId) {
    const attackObject = await AttackObject
        .findOne({ 'stix.id': stixId })
        .sort('-stix.modified')
        .lean()
        .exec();

    return attackObject;
}

exports.exportBundle = async function(options) {
    // Create the bundle to hold the exported objects
    const bundle = {
        type: 'bundle',
        id: `bundle--${uuid.v4()}`,
        objects: []
    };

    // Get the primary objects (objects that match the domain)

    // Build the query
    const query = {
        'stix.x_mitre_domains': options.domain,
        'stix.revoked': { $in: [null, false] },
        'stix.x_mitre_deprecated': { $in: [null, false] }
    };

    // Build the aggregation
    // - Group the documents by stix.id, sorted by stix.modified
    // - Use the last document in each group (according to the value of stix.modified)
    // - Then apply query, skip and limit options
    const aggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}},
        { $replaceRoot: { newRoot: '$document' }},
        { $sort: { 'stix.id': 1 }},
        { $match: query }
    ];

    // Retrieve the primary objects
    const domainGroups = await Group.aggregate(aggregation);
    const domainMatrices = await Matrix.aggregate(aggregation);
    const domainMitigations = await Mitigation.aggregate(aggregation);
    const domainSoftware = await Software.aggregate(aggregation);
    const domainTactics = await Tactic.aggregate(aggregation);
    const domainTechniques = await Technique.aggregate(aggregation);

    const primaryObjects = [...domainGroups, ...domainMatrices, ...domainMitigations, ...domainSoftware, ...domainTactics, ...domainTechniques];

    // No primary objects means that the domain doesn't exist
    if (primaryObjects.length === 0) {
        throw new Error(errors.notFound);
    }

    // Put the primary objects in the bundle
    for (const primaryObject of primaryObjects) {
        bundle.objects.push(primaryObject.stix);
    }

    // Get the relationships that point at primary objects (removing duplicates)

    // Create a map of the primary objects (only use the id, since relationships only reference the id)
    const objectsMap = new Map();
    for (const primaryObject of primaryObjects) {
        objectsMap.set(primaryObject.stix.id, true);
    }

    // Get all of the relationships
    // Use the aggregation to only get the last version of each relationship and
    // filter out revoked and deprecated relationships
    const relationshipQuery = {
        'stix.revoked': { $in: [null, false] },
        'stix.x_mitre_deprecated': { $in: [null, false] }
    };
    const relationshipAggregation = [
        { $sort: { 'stix.id': 1, 'stix.modified': 1 } },
        { $group: { _id: '$stix.id', document: { $last: '$$ROOT' }}},
        { $replaceRoot: { newRoot: '$document' }},
        { $match: relationshipQuery }
    ];
    const allRelationships = await Relationship.aggregate(relationshipAggregation);

    // Iterate over the relationships, keeping any that have a source_ref or target_ref that points at a primary object
    const relationships = [];
    for (const relationship of allRelationships) {
        if (objectsMap.has(relationship.stix.source_ref) || objectsMap.has(relationship.stix.target_ref)) {
            relationships.push(relationship);
        }
    }

    // Put the relationships in the bundle
    for (const relationship of relationships) {
        bundle.objects.push(relationship.stix);
    }

    // Get the secondary objects (additional objects pointed to by a relationship)
    const secondaryObjects = [];
    for (const relationship of relationships) {
        // Check source_ref
        if (!objectsMap.has(relationship.stix.source_ref)) {
            const secondaryObject = await getAttackObject(relationship.stix.source_ref);
            if (secondaryObject) {
                secondaryObjects.push(secondaryObject);
                objectsMap.set(secondaryObject.stix.id, true);
            }
            else {
                console.log(`Could not find secondary object with id ${relationship.stix.source_ref }`);
            }
        }

        // Check target_ref
        if (!objectsMap.has(relationship.stix.target_ref)) {
            const secondaryObject = await getAttackObject(relationship.stix.target_ref);
            if (secondaryObject) {
                secondaryObjects.push(secondaryObject);
                objectsMap.set(secondaryObject.stix.id, true);
            }
            else {
                console.log(`Could not find secondary object with id ${ relationship.stix.target_ref }`);
            }
        }
    }

    // Put the secondary objects in the bundle
    for (const secondaryObject of secondaryObjects) {
        bundle.objects.push(secondaryObject.stix);
    }

    // Create a map of relationship ids
    const relationshipsMap = new Map();
    for (const relationship of relationships) {
        relationshipsMap.set(relationship.stix.id, true);
    }

    // Get any note that references an object in the bundle
    // Start by getting all notes
    const allNotes = await Note.aggregate(relationshipAggregation);

    // Iterate over the notes, keeping any that have an object_ref that points at an object in the bundle
    const notes = [];
    for (const note of allNotes) {
        let includeNote = false;
        for (const objectRef of note.stix.object_refs) {
            if (objectsMap.has(objectRef) || relationshipsMap.has(objectRef)) {
                includeNote = true;
                break;
            }
        }
        if (includeNote) {
            notes.push(note);
        }
    }

    // Put the notes in the bundle
    for (const note of notes) {
        bundle.objects.push(note.stix);
    }

    // Make a list of identities referenced
    const identitiesMap = new Map();
    for (const bundleObject of bundle.objects) {
        if (bundleObject.created_by_ref) {
            identitiesMap.set(bundleObject.created_by_ref, true);
        }
    }

    // Make a list of marking definitions referenced
    const markingDefinitionsMap = new Map();
    for (const bundleObject of bundle.objects) {
        if (bundleObject.object_marking_refs) {
            for (const markingRef of bundleObject.object_marking_refs) {
                markingDefinitionsMap.set(markingRef, true);
            }
        }
    }

    for (const stixId of identitiesMap.keys()) {
        const identity = await getAttackObject(stixId);
        if (identity) {
            bundle.objects.push(identity.stix);
        }
        else {
            console.log(`Referenced identity not found: ${ stixId }`);
        }
    }

    for (const stixId of markingDefinitionsMap.keys()) {
        const markingDefinition = await getAttackObject(stixId);
        bundle.objects.push(markingDefinition.stix);
    }

    // TBD: A marking definition can contain a created_by_ref
    // and an identity can contain a marking definition.
    // An unlikely edge case is for one of those to reference
    // an object that hasn't been loaded by any other object.

    return bundle;
}
