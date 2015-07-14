/*global require, applicationContext */
'use strict';
const joi = require('joi');
const Foxx = require('org/arangodb/foxx');
const httperr = require('http-errors');
const schemas = require('./schemas');
const Session = require('./models').Session;
const sessions = require('./sessions');
const util = require('./util');
const ctrl = new Foxx.Controller(applicationContext);

/** Create a new session.
*
* Creates a new session in the database and returns the session object.
*/
ctrl.post('/', function (req, res) {
  const session = new Session();
  session.set(req.parameters.session);
  sessions.save(session);
  res.json(session.forClient());
  res.status(201);
})
.bodyParam('session', schemas.incomingSession);

/** Get the session's data.
*
* Fetches a session from the database and returns its session data.
*/
ctrl.get('/:sessionId', function (req, res) {
  let session = sessions.byId(req.parameters.sessionId);
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId);

/** Replace the session's data.
*
* Replaces the session data of a session in the database.
*/
ctrl.put('/:sessionId', function (req, res) {
  let session = sessions.byId(req.parameters.sessionId);
  session.set(req.parameters.session);
  sessions.save(session);
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId)
.bodyParam('session', schemas.incomingSession);

/** Destroy the session.
*
* Removes the session from the database.
*/
ctrl.delete('/:sessionId', function (req, res) {
  sessions.remove(req.parameters.sessionId);
  res.status(204);
})
.pathParam('sessionId', schemas.sessionId);

/** Log in a user.
*
* Authenticates the user with the given credentials.
*/
ctrl.put('/:sessionId/authenticate', function (req, res) {
  throw new httperr.NotImplemented('PUT /:sessionId/authenticate');
})
.pathParam('sessionId', schemas.sessionId)
.bodyParam('credentials', schemas.credentials);

/** Log out a user.
*
* Removes the session's user data.
*/
ctrl.put('/:sessionId/logout', function (req, res) {
  let session = sessions.byId(req.parameters.sessionId);
  session.set({uid: null, userData: {}});
  sessions.save(session);
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId);

/** Sign a payload.
*
* Creates a signature for the given payload.
*/
ctrl.post('/:sessionId/sign', function (req, res) {
  let session = sessions.byId(req.parameters.sessionId);
  let signature = util.createSignature(
    session.get('secret'),
    req.parameters.payload
  );
  res.json({signature: signature});
  res.status(201);
})
.pathParam('sessionId', schemas.sessionId)
.bodyParam('payload', schemas.signable);

/** Verify a payload's signature.
*
* Verifies the signature for the given payload.
*/
ctrl.put('/:sessionId/sign/:signature', function (req, res) {
  let payload = req.parameters.payload;
  let session = sessions.byId(req.parameters.sessionId);
  let valid = util.verifySignature(
    session.get('secret'),
    payload,
    req.parameters.signature
  );
  if (!valid) {
    throw new httperr.BadRequest('Invalid signature');
  }
  res.json(payload);
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId)
.pathParam('signature', schemas.signature)
.bodyParam('payload', schemas.signable);
