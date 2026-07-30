'use strict';

const { expect } = require('expect');
const sinon = require('sinon');

const logger = require('../../lib/logger');
const errorHandler = require('../../lib/error-handler');
const {
  DatabaseError,
  DuplicateIdError,
  DuplicateReleaseVersionError,
  InvalidObjectRevisionError,
  InvalidPostOperationError,
  ReleaseContentIntegrityError,
} = require('../../exceptions');

describe('error-handler middleware', function () {
  beforeEach(function () {
    sinon.stub(logger, 'warn');
    sinon.stub(logger, 'error');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should not serialize string characters from InvalidPostOperationError', function () {
    const err = new InvalidPostOperationError(
      'Subtechniques require a parentTechniqueId query parameter. Provide the parent technique ATT&CK ID (e.g., T1234).',
    );
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(Object.keys(err).filter((key) => /^\d+$/.test(key))).toEqual([]);
    expect(res.status.calledOnceWithExactly(400)).toBe(true);
    expect(res.send.calledOnceWithExactly(err.message)).toBe(true);
    expect(next.called).toBe(false);
  });

  it('should preserve structured error properties for InvalidPostOperationError', function () {
    const err = new InvalidPostOperationError({
      details: ['created', 'modified'],
    });
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(res.status.calledOnceWithExactly(400)).toBe(true);
    expect(
      res.send.calledOnceWithExactly({
        message: 'Cannot set the following keys:',
        details: ['created', 'modified'],
      }),
    ).toBe(true);
    expect(next.called).toBe(false);
  });

  it('should preserve custom messages for DuplicateIdError', function () {
    const err = new DuplicateIdError('ATT&CK ID T1234 is already in use');
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(res.status.calledOnceWithExactly(409)).toBe(true);
    expect(res.send.calledOnceWithExactly('ATT&CK ID T1234 is already in use')).toBe(true);
    expect(next.called).toBe(false);
  });

  it('should return a structured conflict for DuplicateReleaseVersionError', function () {
    const trackId = 'release-track--00000000-0000-4000-8000-000000000001';
    const err = new DuplicateReleaseVersionError(trackId, '2.0');
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(res.status.calledOnceWithExactly(409)).toBe(true);
    expect(
      res.send.calledOnceWithExactly({
        message: `Release track ${trackId} already has tagged version 2.0`,
        track_id: trackId,
        version: '2.0',
      }),
    ).toBe(true);
    expect(next.called).toBe(false);
  });

  it('should return missing request revisions as a structured bad request', function () {
    const missing = [
      {
        object_ref: 'attack-pattern--00000000-0000-4000-8000-000000000001',
        object_modified: '2026-01-01T00:00:00.000Z',
      },
    ];
    const err = new InvalidObjectRevisionError(missing);
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(res.status.calledOnceWithExactly(400)).toBe(true);
    expect(
      res.send.calledOnceWithExactly({
        message: 'One or more object revisions do not exist',
        missing_references: missing,
      }),
    ).toBe(true);
    expect(next.called).toBe(false);
  });

  it('should return missing stored revisions as a structured conflict', function () {
    const missing = [
      {
        object_ref: 'attack-pattern--00000000-0000-4000-8000-000000000001',
        object_modified: '2026-01-01T00:00:00.000Z',
      },
    ];
    const err = new ReleaseContentIntegrityError(missing);
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(res.status.calledOnceWithExactly(409)).toBe(true);
    expect(
      res.send.calledOnceWithExactly({
        message: 'Release-track primary content is incomplete',
        missing_references: missing,
      }),
    ).toBe(true);
    expect(next.called).toBe(false);
  });

  it('should preserve wrapped error details for DatabaseError', function () {
    const err = new DatabaseError(new Error('Mongo connection failed'));
    const res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
    const next = sinon.stub();

    errorHandler.serviceExceptions(err, {}, res, next);

    expect(res.status.calledOnceWithExactly(500)).toBe(true);
    expect(
      res.send.calledOnceWithExactly({
        message: 'The database operation failed.',
        details: 'Mongo connection failed',
      }),
    ).toBe(true);
    expect(err.cause).toBeInstanceOf(Error);
    expect(err.cause.message).toBe('Mongo connection failed');
    expect(Object.keys(err)).not.toContain('cause');
    expect(next.called).toBe(false);
  });
});
