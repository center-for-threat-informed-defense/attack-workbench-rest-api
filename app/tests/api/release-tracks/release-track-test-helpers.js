'use strict';

const request = require('supertest');

function exactObjectRef(object) {
  if (object.stix) {
    return { id: object.stix.id, modified: object.stix.modified };
  }
  if (object.object_ref) {
    return { id: object.object_ref, modified: object.object_modified };
  }
  return { id: object.id, modified: object.modified };
}

function authenticated(requestBuilder, passportCookie) {
  return requestBuilder
    .set('Accept', 'application/json')
    .set('Cookie', `${passportCookie.name}=${passportCookie.value}`);
}

async function stageExactMembers(app, passportCookie, trackId, objects) {
  const refs = objects.map(exactObjectRef);
  await authenticated(
    request(app).post(`/api/release-tracks/${trackId}/candidates`).send({ object_refs: refs }),
    passportCookie,
  ).expect(200);

  const response = await authenticated(
    request(app)
      .post(`/api/release-tracks/${trackId}/candidates/promote`)
      .send({ object_refs: refs.map((ref) => ref.id) }),
    passportCookie,
  ).expect(200);
  return response.body;
}

async function releaseExactMembers(app, passportCookie, trackId, objects, releaseBody = {}) {
  await stageExactMembers(app, passportCookie, trackId, objects);
  const response = await authenticated(
    request(app).post(`/api/release-tracks/${trackId}/snapshots/latest/release`).send(releaseBody),
    passportCookie,
  ).expect(200);
  return response.body;
}

module.exports = {
  releaseExactMembers,
  stageExactMembers,
};
