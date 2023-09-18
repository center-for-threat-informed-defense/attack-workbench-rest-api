'use strict';

/**
 * Enumeration of possible model names.
 * @readonly
 * @enum {string}
 */
const ModelName = {
    Campaign: "Campaign",
    Collection: "Collection",
    DataComponent: "Data-Component",
    DataSource: "Data-Source",
    Group: "Intrusion-Set",
    Identity: "IdentityModel",
    MarkingDefinition: "MarkingDefinitionModel",
    Matrix: "MatrixModel",
    Note: "NoteModel",
    Relationship: "Relationship",
    Software: "Software",
    Tactic: "Tactic",
    Technique: "Technique"
};

/**
 * Enumeration of STIX ID prefixes for each model.
 * @readonly
 * @enum {string}
 */
const StixIdPrefix = {
    Campaign: "campaign--",
    Collection: "x-mitre-collection--",
    DataComponent: "x-mitre-data-component--",
    DataSource: "x-mitre-data-source--",
    Group: "intrusion-set--",
    Identity: "identity--",
    MarkingDefinition: "marking-definition--",
    Matrix: "x-mitre-matrix--",
    Note: "note--",
    Relationship: "relationship--",
    Tool: "tool--",
    Malware: "malware--",
    Tactic: "x-mitre-tactic--",
    Technique: "attack-pattern--"
};

/**
 * Retrieves the corresponding STIX ID prefix for a given Mongoose model.
 *
 * @param {mongoose.Model} model - The Mongoose model instance.
 * @param {string} [stixType] - The document.stix.type property. This parameter is used when the model schema name is "Software" to distinguish between 'malware' and 'tool'.
 * @returns {string} The STIX ID prefix corresponding to the provided model's discriminator name.
 * @throws Will throw an error if the model discriminator name is not provided or if the discriminator name doesn't match any known model names.
 */
const getStixIdPrefixFromModel = function (modelName, stixType) {
    if (stixType === 'tool') {
        return StixIdPrefix.Tool;
    } else if (stixType === 'malware') {
        return StixIdPrefix.Malware;
    } else {
        const stixId = StixIdPrefix[
            Object.keys(ModelName).find(key => ModelName[key] === modelName)
        ];
        if (!stixId) {
            throw Error(`Unknown model name: ${modelName}`);
        }
        return stixId;
    }
};

module.exports = {
    ModelName,
    StixIdPrefix,
    getStixIdPrefixFromModel
};