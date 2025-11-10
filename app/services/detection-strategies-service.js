'use strict';

const detectionStrategiesRepository = require('../repository/detection-strategies-repository');
const analyticsRepository = require('../repository/analytics-repository');
const BaseService = require('./_base.service');
const { DetectionStrategy: DetectionStrategyType } = require('../lib/types');
const logger = require('../lib/logger');

class DetectionStrategiesService extends BaseService {
  /**
   * Override create to maintain embedded_relationships bidirectionally
   * When a detection strategy is created and references analytics via x_mitre_analytic_refs,
   * we need to update embedded_relationships on both the strategy (outbound) and the analytics (inbound)
   */
  async create(data, options) {
    // Initialize embedded_relationships if not present
    if (!data.workspace) {
      data.workspace = {};
    }
    if (!data.workspace.embedded_relationships) {
      data.workspace.embedded_relationships = [];
    }

    // Build outbound embedded_relationships for x_mitre_analytic_refs
    const analyticRefs = data.stix?.x_mitre_analytic_refs || [];
    if (analyticRefs.length > 0) {
      const analyticEmbeddedRels = await this.buildEmbeddedRelationshipsForAnalytics(analyticRefs);
      data.workspace.embedded_relationships.push(...analyticEmbeddedRels);
    }

    // Call parent create to handle all standard creation logic
    const createdStrategy = await super.create(data, options);

    // Update inbound embedded_relationships on referenced analytics
    if (analyticRefs.length > 0) {
      try {
        await this.addInboundRelationshipsToAnalytics(analyticRefs, createdStrategy);
      } catch (err) {
        logger.error(
          `Error updating embedded relationships for analytics after creating strategy ${createdStrategy.stix.id}:`,
          err,
        );
        // Don't fail the create operation, but log the error
      }
    }

    return createdStrategy;
  }

  /**
   * Override updateFull to maintain embedded_relationships bidirectionally
   * When x_mitre_analytic_refs changes, update embedded_relationships on both the strategy and affected analytics
   * Also update external_references URLs for analytics if the strategy's ATT&CK ID changed
   */
  async updateFull(stixId, stixModified, data) {
    // Get the existing document to compare analytic refs
    const existingStrategy = await this.repository.retrieveOneByVersion(stixId, stixModified);
    if (!existingStrategy) {
      return null;
    }

    const oldAnalyticRefs = existingStrategy.stix.x_mitre_analytic_refs || [];
    const newAnalyticRefs = data.stix?.x_mitre_analytic_refs || [];
    const oldAttackId = existingStrategy.workspace?.attack_id;
    const newAttackId = data.workspace?.attack_id;

    // Determine which analytics were added, removed, or unchanged
    const addedAnalytics = newAnalyticRefs.filter((ref) => !oldAnalyticRefs.includes(ref));
    const removedAnalytics = oldAnalyticRefs.filter((ref) => !newAnalyticRefs.includes(ref));
    const unchangedAnalytics = newAnalyticRefs.filter((ref) => oldAnalyticRefs.includes(ref));

    // Check if the strategy's ATT&CK ID changed
    const attackIdChanged = oldAttackId !== newAttackId;

    // Update embedded_relationships in the data being saved
    if (!data.workspace) {
      data.workspace = {};
    }
    if (!data.workspace.embedded_relationships) {
      data.workspace.embedded_relationships = [];
    }

    // Rebuild the analytic portion of embedded_relationships
    const existingNonAnalyticRels = (data.workspace.embedded_relationships || []).filter(
      (rel) => !rel.stix_id?.startsWith('x-mitre-analytic--'),
    );
    const analyticEmbeddedRels = await this.buildEmbeddedRelationshipsForAnalytics(newAnalyticRefs);
    data.workspace.embedded_relationships = [...existingNonAnalyticRels, ...analyticEmbeddedRels];

    // Call parent updateFull to handle all standard update logic
    const updatedStrategy = await super.updateFull(stixId, stixModified, data);

    // Update analytics' inbound embedded_relationships and external_references URLs
    try {
      // Add inbound relationships for newly added analytics
      if (addedAnalytics.length > 0) {
        await this.addInboundRelationshipsToAnalytics(addedAnalytics, updatedStrategy);
      }

      // Remove inbound relationships for removed analytics
      if (removedAnalytics.length > 0) {
        await this.removeInboundRelationshipsFromAnalytics(
          removedAnalytics,
          updatedStrategy.stix.id,
        );
      }

      // Update external_references URLs for analytics if the strategy's ATT&CK ID changed
      if (attackIdChanged && unchangedAnalytics.length > 0) {
        await this.updateAnalyticsExternalReferencesUrls(unchangedAnalytics, updatedStrategy);
      }
    } catch (err) {
      logger.error(
        `Error updating embedded relationships for analytics after updating strategy ${updatedStrategy.stix.id}:`,
        err,
      );
      // Don't fail the update operation, but log the error
    }

    return updatedStrategy;
  }

  /**
   * Builds embedded_relationship objects for a list of analytic STIX IDs
   * @param {string[]} analyticRefs - Array of analytic STIX IDs
   * @returns {Promise<Array>} Array of embedded_relationship objects
   */
  async buildEmbeddedRelationshipsForAnalytics(analyticRefs) {
    const embeddedRels = [];

    for (const analyticId of analyticRefs) {
      try {
        // Fetch the latest version of the analytic to get its attack_id
        const analytic = await analyticsRepository.retrieveLatestByStixIdLean(analyticId);

        if (analytic) {
          embeddedRels.push({
            stix_id: analyticId,
            attack_id: analytic.workspace?.attack_id || null,
            direction: 'outbound',
          });
        } else {
          logger.warn(`Could not find analytic ${analyticId} when building embedded relationships`);
          // Still add the relationship without attack_id
          embeddedRels.push({
            stix_id: analyticId,
            attack_id: null,
            direction: 'outbound',
          });
        }
      } catch (err) {
        logger.error(`Error fetching analytic ${analyticId}: ${err.message}`);
        // Add relationship without attack_id
        embeddedRels.push({
          stix_id: analyticId,
          attack_id: null,
          direction: 'outbound',
        });
      }
    }

    return embeddedRels;
  }

  /**
   * Adds inbound embedded_relationships to multiple analytics
   * @param {string[]} analyticIds - Array of analytic STIX IDs
   * @param {object} strategy - The detection strategy document
   */
  async addInboundRelationshipsToAnalytics(analyticIds, strategy) {
    for (const analyticId of analyticIds) {
      try {
        await this.addInboundRelationshipToAnalytic(analyticId, strategy);
      } catch (err) {
        logger.error(`Error adding inbound relationship to analytic ${analyticId}: ${err.message}`);
        // Continue processing other analytics
      }
    }
  }

  /**
   * Adds an inbound embedded_relationship to an analytic and updates its external_references URL
   * @param {string} analyticId - The STIX ID of the analytic
   * @param {object} strategy - The detection strategy document
   */
  async addInboundRelationshipToAnalytic(analyticId, strategy) {
    const {
      createAttackExternalReference,
      removeAttackExternalReferences,
    } = require('../lib/external-reference-builder');

    // Get the latest version of the analytic as a Mongoose document
    const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);

    if (!analytic) {
      logger.warn(`Could not find analytic ${analyticId} to add inbound relationship`);
      return;
    }

    // Initialize embedded_relationships if it doesn't exist
    if (!analytic.workspace.embedded_relationships) {
      analytic.workspace.embedded_relationships = [];
    }

    // Check if this relationship already exists
    const existingRel = analytic.workspace.embedded_relationships.find(
      (rel) => rel.stix_id === strategy.stix.id && rel.direction === 'inbound',
    );

    if (!existingRel) {
      // Add the inbound relationship
      analytic.workspace.embedded_relationships.push({
        stix_id: strategy.stix.id,
        attack_id: strategy.workspace?.attack_id || null,
        direction: 'inbound',
      });

      // Update the analytic's external_references URL now that it has a parent detection strategy
      if (analytic.stix.external_references) {
        // Remove existing ATT&CK external references
        analytic.stix.external_references = removeAttackExternalReferences(
          analytic.stix.external_references,
        );

        // Create new ATT&CK external reference with the parent strategy's URL
        const attackRef = createAttackExternalReference(analytic.toObject());
        if (attackRef) {
          analytic.stix.external_references.unshift(attackRef);
        }
      }

      // Save the updated analytic using the repository method
      await analyticsRepository.saveDocument(analytic);
    }
  }

  /**
   * Removes inbound embedded_relationships from multiple analytics
   * @param {string[]} analyticIds - Array of analytic STIX IDs
   * @param {string} strategyId - The STIX ID of the detection strategy
   */
  async removeInboundRelationshipsFromAnalytics(analyticIds, strategyId) {
    for (const analyticId of analyticIds) {
      try {
        await this.removeInboundRelationshipFromAnalytic(analyticId, strategyId);
      } catch (err) {
        logger.error(
          `Error removing inbound relationship from analytic ${analyticId}: ${err.message}`,
        );
        // Continue processing other analytics
      }
    }
  }

  /**
   * Removes an inbound embedded_relationship from an analytic
   * @param {string} analyticId - The STIX ID of the analytic
   * @param {string} strategyId - The STIX ID of the detection strategy
   */
  async removeInboundRelationshipFromAnalytic(analyticId, strategyId) {
    // Get the latest version of the analytic as a Mongoose document
    const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);

    if (!analytic) {
      logger.warn(`Could not find analytic ${analyticId} to remove inbound relationship`);
      return;
    }

    if (!analytic.workspace.embedded_relationships) {
      return; // Nothing to remove
    }

    // Remove the inbound relationship
    analytic.workspace.embedded_relationships = analytic.workspace.embedded_relationships.filter(
      (rel) => !(rel.stix_id === strategyId && rel.direction === 'inbound'),
    );

    // Save the updated analytic using the repository method
    await analyticsRepository.saveDocument(analytic);
  }

  /**
   * Updates external_references URLs for analytics when their parent detection strategy's ATT&CK ID changes
   * @param {string[]} analyticIds - Array of analytic STIX IDs
   * @param {object} strategy - The updated detection strategy document
   */
  async updateAnalyticsExternalReferencesUrls(analyticIds, strategy) {
    const {
      createAttackExternalReference,
      removeAttackExternalReferences,
    } = require('../lib/external-reference-builder');

    for (const analyticId of analyticIds) {
      try {
        // Get the latest version of the analytic as a Mongoose document
        const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);

        if (!analytic) {
          logger.warn(`Could not find analytic ${analyticId} to update external_references URL`);
          continue;
        }

        // Update the inbound relationship's attack_id in embedded_relationships
        if (analytic.workspace.embedded_relationships) {
          const inboundRel = analytic.workspace.embedded_relationships.find(
            (rel) => rel.stix_id === strategy.stix.id && rel.direction === 'inbound',
          );
          if (inboundRel) {
            inboundRel.attack_id = strategy.workspace?.attack_id || null;
          }
        }

        // Rebuild the ATT&CK external reference with the new URL
        if (analytic.stix.external_references) {
          // Remove existing ATT&CK external references
          analytic.stix.external_references = removeAttackExternalReferences(
            analytic.stix.external_references,
          );

          // Create new ATT&CK external reference with updated URL
          const attackRef = createAttackExternalReference(analytic.toObject());
          if (attackRef) {
            analytic.stix.external_references.unshift(attackRef);
          }
        }

        // Save the updated analytic using the repository method
        await analyticsRepository.saveDocument(analytic);
      } catch (err) {
        logger.error(
          `Error updating external_references URL for analytic ${analyticId}: ${err.message}`,
        );
        // Continue processing other analytics
      }
    }
  }
}

module.exports = new DetectionStrategiesService(
  DetectionStrategyType,
  detectionStrategiesRepository,
);
