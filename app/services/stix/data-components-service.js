'use strict';

const dataComponentsRepository = require('../../repository/data-components-repository');
const { BaseService } = require('../meta-classes');
const { DataComponent: DataComponentType } = require('../../lib/types');
const EventBus = require('../../lib/event-bus');
const logger = require('../../lib/logger');

/**
 * Service for managing data components
 *
 * Event listeners:
 * - x-mitre-analytic::data-components-referenced - Add inbound relationships when analytic references data components
 * - x-mitre-analytic::data-components-removed - Remove inbound relationships when analytic removes data components
 */
class DataComponentsService extends BaseService {
  /**
   * Initialize event listeners
   * Called once on app startup
   */
  static initializeEventListeners() {
    EventBus.on(
      'x-mitre-analytic::data-components-referenced',
      this.handleDataComponentsReferenced.bind(this),
    );

    EventBus.on(
      'x-mitre-analytic::data-components-removed',
      this.handleDataComponentsRemoved.bind(this),
    );

    logger.info('DataComponentsService: Event listeners initialized');
  }

  /**
   * Handle data components being referenced by an analytic
   * Add inbound embedded_relationship
   */
  static async handleDataComponentsReferenced(payload) {
    const { analytic, dataComponentIds } = payload;

    logger.info(
      `DataComponentsService heard event: 'x-mitre-analytic::data-components-referenced' for ${analytic.stix.id}`,
    );

    for (const dataComponentId of dataComponentIds) {
      try {
        const dataComponent =
          await dataComponentsRepository.retrieveLatestByStixId(dataComponentId);

        if (!dataComponent) {
          logger.warn(
            `DataComponentsService: Could not find data component ${dataComponentId} to add inbound relationship`,
          );
          continue;
        }

        // Initialize embedded_relationships if needed
        if (!dataComponent.workspace) {
          dataComponent.workspace = {};
        }
        if (!dataComponent.workspace.embedded_relationships) {
          dataComponent.workspace.embedded_relationships = [];
        }

        // Check if relationship already exists
        const exists = dataComponent.workspace.embedded_relationships.some(
          (rel) => rel.stix_id === analytic.stix.id && rel.direction === 'inbound',
        );

        if (!exists) {
          // Add inbound embedded_relationship
          dataComponent.workspace.embedded_relationships.push({
            stix_id: analytic.stix.id,
            attack_id: analytic.workspace?.attack_id || null,
            name: analytic.stix.name,
            direction: 'inbound',
          });

          logger.info(
            `DataComponentsService: Added inbound relationship from analytic ${analytic.stix.id} to data component ${dataComponentId}`,
          );
        }

        await dataComponentsRepository.saveDocument(dataComponent);
      } catch (error) {
        logger.error(
          `DataComponentsService: Error handling data-components-referenced for ${dataComponentId}:`,
          error,
        );
        // Continue processing other data components
      }
    }
  }

  /**
   * Handle data components being removed from an analytic
   * Remove inbound embedded_relationship
   */
  static async handleDataComponentsRemoved(payload) {
    const { analyticId, dataComponentIds } = payload;

    logger.info(
      `DataComponentsService heard event: 'x-mitre-analytic::data-components-removed' for ${analyticId}`,
    );

    for (const dataComponentId of dataComponentIds) {
      try {
        const dataComponent =
          await dataComponentsRepository.retrieveLatestByStixId(dataComponentId);

        if (!dataComponent) {
          logger.warn(
            `DataComponentsService: Could not find data component ${dataComponentId} to remove inbound relationship`,
          );
          continue;
        }

        if (dataComponent.workspace?.embedded_relationships) {
          // Remove inbound embedded_relationship
          const initialLength = dataComponent.workspace.embedded_relationships.length;
          dataComponent.workspace.embedded_relationships =
            dataComponent.workspace.embedded_relationships.filter(
              (rel) => !(rel.stix_id === analyticId && rel.direction === 'inbound'),
            );

          const removed = dataComponent.workspace.embedded_relationships.length < initialLength;
          if (removed) {
            logger.info(
              `DataComponentsService: Removed inbound relationship from analytic ${analyticId} to data component ${dataComponentId}`,
            );
          }
        }

        await dataComponentsRepository.saveDocument(dataComponent);
      } catch (error) {
        logger.error(
          `DataComponentsService: Error handling data-components-removed for ${dataComponentId}:`,
          error,
        );
        // Continue processing other data components
      }
    }
  }
}

DataComponentsService.initializeEventListeners();

module.exports = new DataComponentsService(DataComponentType, dataComponentsRepository);
