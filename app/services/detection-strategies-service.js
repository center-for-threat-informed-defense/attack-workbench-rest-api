'use strict';

const detectionStrategiesRepository = require('../repository/detection-strategies-repository');
const analyticsRepository = require('../repository/analytics-repository');
const BaseService = require('./_base.service');
const { DetectionStrategy: DetectionStrategyType } = require('../lib/types');
const logger = require('../lib/logger');
const EventBus = require('../lib/event-bus');

/**
 * Service for managing detection strategies
 *
 * Lifecycle hooks:
 * - beforeCreate: Builds outbound embedded_relationships for x_mitre_analytic_refs
 * - afterCreate: Emits domain event to notify AnalyticsService
 * - beforeUpdate: Updates outbound embedded_relationships when refs change
 * - afterUpdate: Emits domain events for added/removed analytics
 *
 * Events emitted (listened to by AnalyticsService):
 * - x-mitre-detection-strategy::analytics-referenced
 * - x-mitre-detection-strategy::analytics-removed
 */
class DetectionStrategiesService extends BaseService {
  /**
   * Prepare detection strategy data before creation
   * Build outbound embedded_relationships for x_mitre_analytic_refs
   */
  async beforeCreate(data) {
    // Initialize embedded_relationships if not present
    if (!data.workspace) {
      data.workspace = {};
    }
    if (!data.workspace.embedded_relationships) {
      data.workspace.embedded_relationships = [];
    }

    // Build outbound embedded_relationships for x_mitre_analytic_refs
    // Cross-repository READS are allowed for denormalization (see CROSS_SERVICE_READS_PATTERN.md)
    // We emit events in afterCreate/afterUpdate for cross-service WRITES
    const analyticRefs = data.stix?.x_mitre_analytic_refs || [];
    for (const analyticId of analyticRefs) {
      try {
        const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);
        data.workspace.embedded_relationships.push({
          stix_id: analyticId,
          attack_id: analytic?.workspace?.attack_id || null,
          name: analytic?.stix?.name || null,
          direction: 'outbound',
        });
      } catch (error) {
        logger.warn(
          `DetectionStrategiesService: Could not fetch analytic ${analyticId} for outbound relationship`,
          error,
        );
        // Add relationship without attack_id
        data.workspace.embedded_relationships.push({
          stix_id: analyticId,
          attack_id: null,
          name: null,
          direction: 'outbound',
        });
      }
    }
  }

  /**
   * Handle post-creation logic
   * Emit domain event to notify AnalyticsService that analytics were referenced
   */
  async afterCreate(document) {
    const analyticRefs = document.stix?.x_mitre_analytic_refs || [];

    if (analyticRefs.length > 0) {
      logger.info(
        `DetectionStrategiesService: Emitting analytics-referenced event for ${analyticRefs.length} analytic(s)`,
        { stixId: document.stix.id, analyticIds: analyticRefs },
      );

      await EventBus.emit('x-mitre-detection-strategy::analytics-referenced', {
        detectionStrategyId: document.stix.id,
        detectionStrategy: document.toObject ? document.toObject() : document,
        analyticIds: analyticRefs,
      });
    }
  }

  /**
   * Prepare detection strategy data before update
   * Detect changes in x_mitre_analytic_refs and update outbound embedded_relationships
   */
  async beforeUpdate(stixId, stixModified, data, existingDocument) {
    const oldAnalyticRefs = existingDocument.stix?.x_mitre_analytic_refs || [];
    const newAnalyticRefs = data.stix?.x_mitre_analytic_refs || [];

    // Store change detection for afterUpdate
    this._addedAnalyticRefs = newAnalyticRefs.filter((ref) => !oldAnalyticRefs.includes(ref));
    this._removedAnalyticRefs = oldAnalyticRefs.filter((ref) => !newAnalyticRefs.includes(ref));

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

    const analyticEmbeddedRels = [];
    for (const analyticId of newAnalyticRefs) {
      try {
        const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);
        analyticEmbeddedRels.push({
          stix_id: analyticId,
          attack_id: analytic?.workspace?.attack_id || null,
          direction: 'outbound',
        });
      } catch (error) {
        logger.warn(
          `DetectionStrategiesService: Could not fetch analytic ${analyticId} for outbound relationship`,
          error,
        );
        analyticEmbeddedRels.push({
          stix_id: analyticId,
          attack_id: null,
          direction: 'outbound',
        });
      }
    }

    data.workspace.embedded_relationships = [...existingNonAnalyticRels, ...analyticEmbeddedRels];
  }

  /**
   * Handle post-update logic
   * Emit domain events for analytics that were added or removed
   */
  async afterUpdate(updatedDocument) {
    const addedRefs = this._addedAnalyticRefs || [];
    const removedRefs = this._removedAnalyticRefs || [];

    // Emit event for newly referenced analytics
    if (addedRefs.length > 0) {
      logger.info(
        `DetectionStrategiesService: Emitting analytics-referenced event for ${addedRefs.length} added analytic(s)`,
        { stixId: updatedDocument.stix.id, analyticIds: addedRefs },
      );

      await EventBus.emit('x-mitre-detection-strategy::analytics-referenced', {
        detectionStrategyId: updatedDocument.stix.id,
        detectionStrategy: updatedDocument.toObject ? updatedDocument.toObject() : updatedDocument,
        analyticIds: addedRefs,
      });
    }

    // Emit event for removed analytics
    if (removedRefs.length > 0) {
      logger.info(
        `DetectionStrategiesService: Emitting analytics-removed event for ${removedRefs.length} removed analytic(s)`,
        { stixId: updatedDocument.stix.id, analyticIds: removedRefs },
      );

      await EventBus.emit('x-mitre-detection-strategy::analytics-removed', {
        detectionStrategyId: updatedDocument.stix.id,
        analyticIds: removedRefs,
      });
    }

    // Clean up instance variables
    delete this._addedAnalyticRefs;
    delete this._removedAnalyticRefs;
  }
}

module.exports = new DetectionStrategiesService(
  DetectionStrategyType,
  detectionStrategiesRepository,
);
