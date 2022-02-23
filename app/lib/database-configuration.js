'use strict';

const fs = require('fs').promises;
const path = require('path');

const identitiesService = require('../services/identities-service');
const systemConfigurationService = require('../services/system-configuration-service');
const logger = require('../lib/logger');
const AttackObject = require('../models/attack-object-model');
const CollectionIndex = require('../models/collection-index-model');
const MarkingDefinition = require('../models/marking-definition-model');

async function createPlaceholderOrganizationIdentity() {
    // Create placeholder identity object
    const timestamp = new Date().toISOString();
    const placeholderIdentity = {
        workspace: {
            workflow: {
                state: 'awaiting-review'
            }
        },
        stix: {
            created: timestamp,
            modified: timestamp,
            name: 'Placeholder Organization Identity',
            identity_class: 'organization',
            spec_version: '2.1',
            type: 'identity',
            description: 'This is a placeholder organization identity. Please edit it or replace it with another identity.'
        }
    };

    try {
        const newIdentity = await identitiesService.create(placeholderIdentity, { import: false });

        // Set the organization identity to the placeholder identity
        await systemConfigurationService.setOrganizationIdentity(newIdentity.stix.id);
        logger.info(`Organization identity set to placeholder identity with id: ${ newIdentity.stix.id }`);
    }
    catch(err) {
        logger.error('Unable to create or set placeholder organization identity: ' + err);
        throw err;
    }
}

async function checkForOrganizationIdentity() {
    try {
        const identity = await systemConfigurationService.retrieveOrganizationIdentity();
        logger.info(`Success: Organization identity is set to ${ identity.stix.name }`);
    }
    catch(err) {
        if (err.message === systemConfigurationService.errors.organizationIdentityNotFound) {
            logger.warn(`Organization identity with id ${ err.organizationIdentityRef } not found, setting to placeholder identity`);
            await createPlaceholderOrganizationIdentity();
        }
        else if (err.message === systemConfigurationService.errors.organizationIdentityNotSet) {
            logger.warn(`Organization identity not set, setting to placeholder identity`);
            await createPlaceholderOrganizationIdentity();
        }
        else {
            logger.error("Unable to retrieve organization identity, failed with error: " + err);
            logger.warn(`Attempting to set organization identity to placeholder identity`);
            await createPlaceholderOrganizationIdentity();
        }
    }
}

async function checkForInvalidEnterpriseCollectionId() {
    // The v1.0 release of ATT&CK Workbench used x-mitre-collection--23320f4-22ad-8467-3b73-ed0c869a12838 for the id of
    // the Enterprise collection object. This value isn't a legal STIX id (the UUID portion is incorect).
    // This function checks for the presence of the invalid id and replaces it with a valid id wherever found.
    const invalidId = 'x-mitre-collection--23320f4-22ad-8467-3b73-ed0c869a12838';
    const validId = 'x-mitre-collection--402e24b4-436e-4936-b19b-2038648f489';

    logger.info(`Starting check for invalid enterprise collection id. This may take a few minutes the first time it runs...`);

    let collectionUpdates = 0;
    let objectUpdates = 0;
    const attackObjects = await AttackObject.find();
    for (const attackObject of attackObjects) {
        // Check for x-mitre-collection objects
        if (attackObject.stix.type === 'x-mitre-collection') {
            if (attackObject.stix.id === invalidId) {
                attackObject.stix.id = validId;
                // eslint-disable-next-line no-await-in-loop
                await attackObject.save();
                collectionUpdates += 1;
            }
        }
        // Check for an object that references an invalid x-mitre-collection id
        else {
            let attackObjectUpdated = false;
            for (const collectionRef of attackObject.workspace.collections) {
                if (collectionRef.collection_ref === invalidId) {
                    collectionRef.collection_ref = validId;
                    attackObjectUpdated = true;
                }
            }
            if (attackObjectUpdated) {
                // eslint-disable-next-line no-await-in-loop
                await attackObject.save();
                objectUpdates += 1;
            }
        }

    }

    let collectionIndexUpdates = 0;
    const collectionIndexes = await CollectionIndex.find();
    for (const collectionIndex of collectionIndexes) {
        // Check the list of collections
        let collectionIndexUpdated = false;
        for (const collection of collectionIndex.collection_index.collections) {
            if (collection.id === invalidId) {
                collection.id = validId;
                collectionIndexUpdated = true;
            }
        }

        // Check the list of subscriptions
        if (collectionIndex.workspace?.update_policy?.subscriptions) {
            for (let i = 0; i < collectionIndex.workspace.update_policy.subscriptions.length; i++) {
                if (collectionIndex.workspace.update_policy.subscriptions[i] === invalidId) {
                    collectionIndex.workspace.update_policy.subscriptions[i] = validId;
                    collectionIndexUpdated = true;
                }
            }
        }

        if (collectionIndexUpdated) {
            // eslint-disable-next-line no-await-in-loop
            await collectionIndex.save();
            collectionIndexUpdates += 1;
        }
    }

    if (collectionUpdates > 0) {
        logger.warn(`Fixed ${ collectionUpdates } instances of x-mitre-collection that had an invalid STIX id.`);
    }

    if (objectUpdates > 0) {
        logger.warn(`Fixed ${ objectUpdates } ATT&CK objects that referenced an invalid x-mitre-collection STIX id.`);
    }

    if (collectionIndexUpdates > 0) {
        logger.warn(`Fixed ${ collectionIndexUpdates } Collection Indexes that referenced an invalid x-mitre-collection STIX id.`);
    }
}

async function checkForStaticMarkingDefinitions() {
    // Get the list static marking definitions configured for the system
    const files = await fs.readdir('./app/lib/default-static-marking-definitions');

    try {
        for (const file of files.filter(file => path.extname(file) === '.json')) {
            const filePath = './app/lib/default-static-marking-definitions/' + file;
            const fileData = await fs.readFile(filePath);
            const staticMarkingDefinitionList = JSON.parse(fileData.toString());

            for (const staticMarkingDefinition of staticMarkingDefinitionList) {
                const markingDefinition = await MarkingDefinition.findOne({ 'stix.id': staticMarkingDefinition.id }).lean();
                if (!markingDefinition) {
                    const newMarkingDefinitionData = {
                        workspace: {
                            workflow: {
                                state: 'static'
                            }
                        },
                        stix: staticMarkingDefinition
                    };
                    try {
                        const newMarkingDefinition = new MarkingDefinition(newMarkingDefinitionData);
                        await newMarkingDefinition.save();
                        logger.info(`Created static marking definition ${newMarkingDefinition.stix.name}`);
                    }
                    catch(err) {
                        logger.error(`Unable to create static marking definition ${ staticMarkingDefinition.name }`);
                    }
                }
            }
        }
    }
    catch(err) {
        logger.error('Unable to parse default static marking definitions');
    }
}

exports.checkSystemConfiguration = async function() {
    logger.info(`Performing system configuration check...`);
    await checkForOrganizationIdentity();
    await checkForInvalidEnterpriseCollectionId();
    await checkForStaticMarkingDefinitions();
}
