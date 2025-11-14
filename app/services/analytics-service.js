'use strict';

const analyticsRepository = require('../repository/analytics-repository');
const BaseService = require('./_base.service');
const { Analytic: AnalyticType } = require('../lib/types');
const detectionStrategiesService = require('./detection-strategies-service');
const dataComponentsService = require('./data-components-service');
const {
  createAttackExternalReference,
  removeAttackExternalReferences,
} = require('../lib/external-reference-builder');
const EventBus = require('../lib/event-bus');
const logger = require('../lib/logger');

/**
 * Service for managing analytics
 *
 * Event listeners:
 * - x-mitre-detection-strategy::analytics-referenced - Add inbound relationships when detection strategy references analytics
 * - x-mitre-detection-strategy::analytics-removed - Remove inbound relationships when detection strategy removes analytics
 */
class AnalyticsService extends BaseService {
  /**
   * Initialize event listeners
   * Called once on app startup
   */
  static initializeEventListeners() {
    EventBus.on(
      'x-mitre-detection-strategy::analytics-referenced',
      this.handleAnalyticsReferenced.bind(this),
    );

    EventBus.on(
      'x-mitre-detection-strategy::analytics-removed',
      this.handleAnalyticsRemoved.bind(this),
    );

    logger.info('AnalyticsService: Event listeners initialized');
  }

  /**
   * Handle analytics being referenced by a detection strategy
   * Add inbound embedded_relationship and update external_references
   */
  static async handleAnalyticsReferenced(payload) {
    const { detectionStrategy, analyticIds } = payload;

    for (const analyticId of analyticIds) {
      try {
        const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);

        if (!analytic) {
          logger.warn(
            `AnalyticsService: Could not find analytic ${analyticId} to add inbound relationship`,
          );
          continue;
        }

        // Initialize embedded_relationships if needed
        if (!analytic.workspace) {
          analytic.workspace = {};
        }
        if (!analytic.workspace.embedded_relationships) {
          analytic.workspace.embedded_relationships = [];
        }

        // Check if relationship already exists
        const exists = analytic.workspace.embedded_relationships.some(
          (rel) => rel.stix_id === detectionStrategy.stix.id && rel.direction === 'inbound',
        );

        if (!exists) {
          // Add inbound embedded_relationship
          analytic.workspace.embedded_relationships.push({
            stix_id: detectionStrategy.stix.id,
            attack_id: detectionStrategy.workspace?.attack_id || null,
            direction: 'inbound',
          });

          logger.info(
            `AnalyticsService: Added inbound relationship from detection strategy ${detectionStrategy.stix.id} to analytic ${analyticId}`,
          );
        }

        // Update external_references with URL to parent detection strategy
        if (!analytic.stix.external_references) {
          analytic.stix.external_references = [];
        }

        // Remove existing ATT&CK external references
        analytic.stix.external_references = removeAttackExternalReferences(
          analytic.stix.external_references,
        );

        // Create new ATT&CK external reference with URL
        const attackRef = createAttackExternalReference(analytic.toObject());
        if (attackRef) {
          analytic.stix.external_references.unshift(attackRef);
          logger.info(
            `AnalyticsService: Updated external_references URL for analytic ${analyticId}`,
          );
        }

        await analyticsRepository.saveDocument(analytic);
      } catch (error) {
        logger.error(
          `AnalyticsService: Error handling analytics-referenced for ${analyticId}:`,
          error,
        );
        // Continue processing other analytics
      }
    }
  }

  /**
   * Handle analytics being removed from a detection strategy
   * Remove inbound embedded_relationship and update external_references
   */
  static async handleAnalyticsRemoved(payload) {
    const { detectionStrategyId, analyticIds } = payload;

    for (const analyticId of analyticIds) {
      try {
        const analytic = await analyticsRepository.retrieveLatestByStixId(analyticId);

        if (!analytic) {
          logger.warn(
            `AnalyticsService: Could not find analytic ${analyticId} to remove inbound relationship`,
          );
          continue;
        }

        if (analytic.workspace?.embedded_relationships) {
          // Remove inbound embedded_relationship
          const initialLength = analytic.workspace.embedded_relationships.length;
          analytic.workspace.embedded_relationships =
            analytic.workspace.embedded_relationships.filter(
              (rel) => !(rel.stix_id === detectionStrategyId && rel.direction === 'inbound'),
            );

          const removed = analytic.workspace.embedded_relationships.length < initialLength;
          if (removed) {
            logger.info(
              `AnalyticsService: Removed inbound relationship from detection strategy ${detectionStrategyId} to analytic ${analyticId}`,
            );
          }
        }

        // Update external_references (remove URL since no parent)
        if (analytic.stix?.external_references) {
          // analytic.stix.external_references = removeAttackExternalReferences(
          //   analytic.stix.external_references,
          // );

          // Rebuild external reference without URL (no parent detection strategy)
          const existingAttackRef =
            analytic.stix.external_references.find(
              (ref) => ref && ref.source_name === 'mitre-attack',
            ) || null;

          if (existingAttackRef) delete existingAttackRef.url;

          // const attackRef = {
          //   source_name: 'mitre-attack',
          //   external_id: analytic.workspace.attack_id,
          // };
          // const attackRef = createAttackExternalReference(analytic.toObject());
          // if (attackRef) {
          //   analytic.stix.external_references.unshift(attackRef);
          // }

          logger.info(
            `AnalyticsService: Removed external_references URL for analytic ${analyticId}`,
          );
        }

        await analyticsRepository.saveDocument(analytic);
      } catch (error) {
        logger.error(
          `AnalyticsService: Error handling analytics-removed for ${analyticId}:`,
          error,
        );
        // Continue processing other analytics
      }
    }
  }
  /**
   * Override updateFull to ensure external_references URL is updated if parent detection strategy changes
   * This can happen if the analytic's embedded_relationships are modified
   */
  async updateFull(stixId, stixModified, data) {
    // Get the existing document
    const existingAnalytic = await this.repository.retrieveOneByVersion(stixId, stixModified);
    if (!existingAnalytic) {
      return null;
    }

    // Check if embedded_relationships changed (specifically inbound detection strategy relationships)
    const oldEmbeddedRels = existingAnalytic.workspace?.embedded_relationships || [];
    const newEmbeddedRels = data.workspace?.embedded_relationships || [];

    const oldParentStrategy = oldEmbeddedRels.find(
      (rel) =>
        rel.direction === 'inbound' && rel.stix_id?.startsWith('x-mitre-detection-strategy--'),
    );
    const newParentStrategy = newEmbeddedRels.find(
      (rel) =>
        rel.direction === 'inbound' && rel.stix_id?.startsWith('x-mitre-detection-strategy--'),
    );

    const parentStrategyChanged =
      oldParentStrategy?.stix_id !== newParentStrategy?.stix_id ||
      oldParentStrategy?.attack_id !== newParentStrategy?.attack_id;

    // If parent detection strategy changed, rebuild the ATT&CK external reference
    if (parentStrategyChanged && data.stix?.external_references) {
      // Remove existing ATT&CK external references
      data.stix.external_references = removeAttackExternalReferences(data.stix.external_references);

      // Create new ATT&CK external reference with updated URL
      const attackRef = createAttackExternalReference({
        workspace: data.workspace,
        stix: data.stix,
      });

      if (attackRef) {
        data.stix.external_references.unshift(attackRef);
      }
    }

    // Call parent updateFull to handle all standard update logic
    return await super.updateFull(stixId, stixModified, data);
  }
  async retrieveAll(options) {
    const results = await super.retrieveAll(options);

    if (options.includeRefs) {
      if (options.includePagination) {
        await this.addRelatedObjectsToAll(results.data);
      } else {
        await this.addRelatedObjectsToAll(results);
      }
    }

    return results;
  }

  async retrieveById(stixId, options) {
    const results = await super.retrieveById(stixId, options);

    if (options.includeRefs) {
      await this.addRelatedObjectsToAll(results);
    }

    return results;
  }

  async addRelatedObjectsToAll(analytics) {
    for (const analytic of analytics) {
      await this.addRelatedObjects(analytic);
    }
  }

  async addRelatedObjects(analytic) {
    const relatedObjects = [];

    try {
      // Find detection strategies that reference this analytic
      const detectionStrategies = await this.findDetectionStrategiesReferencingAnalytic(
        analytic.stix.id,
      );
      for (const detectionStrategy of detectionStrategies) {
        relatedObjects.push(
          this.formatRelatedObject(detectionStrategy, 'x-mitre-detection-strategy'),
        );
      }

      // Find data components referenced by this analytic
      const dataComponents = await this.findDataComponentsReferencedByAnalytic(analytic);
      for (const dataComponent of dataComponents) {
        relatedObjects.push(this.formatRelatedObject(dataComponent, 'x-mitre-data-component'));
      }
    } catch (err) {
      // Log error but don't fail the main request
      console.warn('Error fetching related objects for analytic:', err.message);
    }

    analytic.related_to = relatedObjects;
  }

  async findDetectionStrategiesReferencingAnalytic(analyticId) {
    try {
      // Query detection strategies where x_mitre_analytics array contains the analytic ID
      const options = {
        offset: 0,
        limit: 0,
        includeRevoked: false,
        includeDeprecated: false,
        includePagination: false,
      };

      // Get all detection strategies and filter in memory
      // (BaseRepository doesn't have a direct way to query array contains)
      const allStrategies = await detectionStrategiesService.retrieveAll(options);

      return allStrategies.filter(
        (strategy) =>
          strategy.stix.x_mitre_analytic_refs &&
          strategy.stix.x_mitre_analytic_refs.includes(analyticId),
      );
    } catch (err) {
      console.warn('Error finding detection strategies:', err.message);
      return [];
    }
  }

  async findDataComponentsReferencedByAnalytic(analytic) {
    try {
      if (
        !analytic.stix.x_mitre_log_source_references ||
        analytic.stix.x_mitre_log_source_references.length === 0
      ) {
        return [];
      }

      const dataComponentIds = analytic.stix.x_mitre_log_source_references.map(
        (ref) => ref.x_mitre_data_component_ref,
      );
      const dataComponents = [];

      // Fetch each data component by ID
      for (const dataComponentId of dataComponentIds) {
        try {
          const dataComponentResults = await dataComponentsService.retrieveById(dataComponentId, {
            versions: 'latest',
          });
          if (dataComponentResults.length > 0) {
            dataComponents.push(dataComponentResults[0]);
          }
        } catch (err) {
          console.warn(`Error fetching data component ${dataComponentId}:`, err.message);
        }
      }

      return dataComponents;
    } catch (err) {
      console.warn('Error finding data components:', err.message);
      return [];
    }
  }

  formatRelatedObject(obj, type) {
    const attackId =
      obj.stix.external_references && obj.stix.external_references.length > 0
        ? obj.stix.external_references[0].external_id
        : null;

    return {
      id: obj.stix.id,
      name: obj.stix.name,
      attack_id: attackId,
      type: type,
    };
  }
}

AnalyticsService.initializeEventListeners();

module.exports = new AnalyticsService(AnalyticType, analyticsRepository);
