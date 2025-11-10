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

module.exports = new DetectionStrategiesService(
  DetectionStrategyType,
  detectionStrategiesRepository,
);
