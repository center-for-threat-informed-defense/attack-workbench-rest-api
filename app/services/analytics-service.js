'use strict';

const analyticsRepository = require('../repository/analytics-repository');
const BaseService = require('./_base.service');
const { Analytic: AnalyticType } = require('../lib/types');
const detectionStrategiesService = require('./detection-strategies-service');
const dataComponentsService = require('./data-components-service');

class AnalyticsService extends BaseService {
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

module.exports = new AnalyticsService(AnalyticType, analyticsRepository);
