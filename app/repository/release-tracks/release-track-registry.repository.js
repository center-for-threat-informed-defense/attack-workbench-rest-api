'use strict';

const ReleaseTrackRegistryModel = require('../../models/release-tracks/release-track-registry-model');
const regexValidator = require('../../lib/regex');
const {
  DatabaseError,
  DuplicateIdError,
  BadlyFormattedParameterError,
} = require('../../exceptions');

class ReleaseTrackRegistryRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    try {
      const document = new this.model(data);
      const saved = await document.save();
      return saved.toObject();
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError({
          details: `Release track with id '${data.track_id}' already exists.`,
        });
      }
      throw new DatabaseError(err);
    }
  }

  async findByTrackId(trackId) {
    try {
      return await this.model.findOne({ track_id: trackId }).lean().exec();
    } catch (err) {
      if (err.name === 'CastError') {
        throw new BadlyFormattedParameterError({ parameterName: 'trackId' });
      }
      throw new DatabaseError(err);
    }
  }

  async findAll(options = {}) {
    try {
      const query = {};

      if (options.type) {
        query.type = options.type;
      }

      const aggregation = [{ $sort: { name: 1 } }, { $match: query }];

      if (options.search) {
        const sanitized = regexValidator.sanitizeRegex(options.search);
        aggregation.push({
          $match: {
            $or: [
              { name: { $regex: sanitized, $options: 'i' } },
              { description: { $regex: sanitized, $options: 'i' } },
            ],
          },
        });
      }

      // Total count before pagination
      const totalCountResult = await this.model.aggregate(aggregation).count('totalCount').exec();
      const totalCount = totalCountResult[0]?.totalCount || 0;

      // Pagination
      aggregation.push({ $skip: options.offset || 0 });
      if (options.limit) {
        aggregation.push({ $limit: options.limit });
      }

      const documents = await this.model.aggregate(aggregation).exec();

      return {
        data: documents,
        pagination: {
          total: totalCount,
          offset: options.offset || 0,
          limit: options.limit || 0,
        },
      };
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findWithTaggedReleases(options = {}) {
    try {
      const query = { 'tagged_releases.0': { $exists: true } };
      if (options.type) {
        query.type = options.type;
      }

      return await this.model
        .find(query)
        .select('track_id type name tagged_releases')
        .sort({ track_id: 1 })
        .lean()
        .exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async findScheduledVirtualTracks() {
    try {
      return await this.model
        .find({
          type: 'virtual',
          'snapshot_schedule.mode': { $in: ['cron', 'dates'] },
        })
        .select('track_id name snapshot_schedule')
        .sort({ track_id: 1 })
        .lean()
        .exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async replaceTaggedReleases(trackId, taggedReleases, latestTaggedVersion) {
    try {
      return await this.model
        .findOneAndUpdate(
          { track_id: trackId },
          {
            $set: {
              tagged_releases: taggedReleases,
              tagged_release_count: taggedReleases.length,
              latest_tagged_version: latestTaggedVersion,
              updated_at: new Date(),
            },
          },
          { new: true, runValidators: true, lean: true },
        )
        .exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  async updateByTrackId(trackId, updates) {
    try {
      const result = await this.model
        .findOneAndUpdate(
          { track_id: trackId },
          { $set: updates },
          { new: true, runValidators: true, lean: true },
        )
        .exec();

      return result;
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
        throw new DuplicateIdError({
          details: `Duplicate key conflict while updating track '${trackId}'.`,
        });
      }
      throw new DatabaseError(err);
    }
  }

  async deleteByTrackId(trackId) {
    try {
      return await this.model.findOneAndDelete({ track_id: trackId }).lean().exec();
    } catch (err) {
      throw new DatabaseError(err);
    }
  }
}

module.exports = new ReleaseTrackRegistryRepository(ReleaseTrackRegistryModel);
