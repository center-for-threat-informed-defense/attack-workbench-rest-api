'use strict';

const AttackObject = require('../models/attack-object-model');

// Default implmentation. Retrieves the attack object from the database.
async function getAttackObjectFromDatabase(attackId) {
    const attackObject = await AttackObject
        .findOne({ 'workspace.attack_id': attackId })
        .sort('-stix.modified')
        .lean()
        .exec();

    return attackObject;
}
exports.getAttackObjectFromDatabase = getAttackObjectFromDatabase;

const sourceNames = ['mitre-attack', 'mitre-mobile-attack', 'mobile-attack', 'mitre-ics-attack'];
function attackReference(externalReferences) {
    if (Array.isArray(externalReferences) && externalReferences.length > 0) {
        return externalReferences.find(ref => sourceNames.includes(ref.source_name));
    }
    else {
        return null;
    }
}

const linkByIdRegex = /\(LinkById: ([A-Z]+[0-9]+(\.[0-9]+)?)\)/g;
async function convertLinkById(text, getAttackObject) {
    if (text) {
        let convertedText = '';
        let lastIndex = 0;

        const matches = text.matchAll(linkByIdRegex);
        for (const match of matches) {
            const prefix = text.slice(lastIndex, match.index);
            const attackId = match[1];
            const citation = {
                name: 'linked object not found',
                url: ''
            }

            if (attackId) {
                const attackObject = await getAttackObject(attackId);
                if (attackObject) {
                    citation.name = attackObject.stix.name;
                    const reference = attackReference(attackObject?.stix.external_references);
                    if (reference) {
                        citation.url = reference.url;
                    }
                }
            }

            convertedText = convertedText.concat(prefix, `[${ citation.name }](${ citation.url })`);
            lastIndex = match.index + match[0].length;
        }

        const postText = text.slice(lastIndex);
        convertedText = convertedText.concat(postText);

        return convertedText;
    }
    else {
        return text;
    }
}

async function convertExternalReferencesWithLinkById(externalReferences, getAttackObject) {
    if (Array.isArray(externalReferences)) {
        for (const externalReference of externalReferences) {
            externalReference.description = await convertLinkById(externalReference.description, getAttackObject);
        }
    }
}


// If provided, getAttackObject() must be an async function with the signature:
//   getAttackObject(attackId) returning an attack object
async function convertLinkByIdTags (stixObject, getAttackObject) {
    if (!(getAttackObject instanceof Function)) {
        getAttackObject = getAttackObjectFromDatabase;
    }

    if (stixObject) {
        stixObject.description = await convertLinkById(stixObject.description, getAttackObject);

        if (stixObject.type === 'attack-pattern') {
            stixObject.x_mitre_detection = await convertLinkById(stixObject.x_mitre_detection, getAttackObject);
        }

        await convertExternalReferencesWithLinkById(stixObject.external_references, getAttackObject);
    }
}
exports.convertLinkByIdTags = convertLinkByIdTags;
