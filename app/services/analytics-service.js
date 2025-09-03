'use strict';

const analyticsRepository = require('../repository/analytics-repository');
const BaseService = require('./_base.service');
const { Analytic: AnalyticType } = require('../lib/types');
const detectionStrategiesService = require('./detection-strategies-service');
const logSourcesService = require('./log-sources-service');

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

      // Find log sources referenced by this analytic
      const logSources = await this.findLogSourcesReferencedByAnalytic(analytic);
      for (const logSource of logSources) {
        relatedObjects.push(this.formatRelatedObject(logSource, 'x-mitre-log-source'));
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

  async findLogSourcesReferencedByAnalytic(analytic) {
    try {
      if (
        !analytic.stix.x_mitre_log_source_references ||
        analytic.stix.x_mitre_log_source_references.length === 0
      ) {
        return [];
      }

      const logSourceIds = analytic.stix.x_mitre_log_source_references.map(
        (ref) => ref.x_mitre_log_source_ref,
      );
      const logSources = [];

      // Fetch each log source by ID
      for (const logSourceId of logSourceIds) {
        try {
          const logSourceResults = await logSourcesService.retrieveById(logSourceId, {
            versions: 'latest',
          });
          if (logSourceResults.length > 0) {
            logSources.push(logSourceResults[0]);
          }
        } catch (err) {
          console.warn(`Error fetching log source ${logSourceId}:`, err.message);
        }
      }

      return logSources;
    } catch (err) {
      console.warn('Error finding log sources:', err.message);
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
