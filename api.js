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
  session.set(req.params('session'));
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
  let session = sessions.byId(req.params('sessionId'));
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId);

/** Replace the session's data.
*
* Replaces the session data of a session in the database.
*/
ctrl.put('/:sessionId', function (req, res) {
  let session = sessions.byId(req.params('sessionId'));
  session.set(req.params('session'));
  sessions.replace(session);
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
  sessions.remove(req.params('sessionId'));
  res.status(204);
})
.pathParam('sessionId', schemas.sessionId);

/** Log in a user.
*
* Authenticates the user with the given credentials.
*/
ctrl.put('/:sessionId/authenticate', function (req, res) {
  let session = sessions.byId(req.params('sessionId'));
  let credentials = req.params('credentials');
  let userData = util.authenticate(credentials.username, credentials.password);
  session.set({
    uid: credentials.username,
    userData: userData
  });
  session.save();
  res.status(204);
})
.pathParam('sessionId', schemas.sessionId)
.bodyParam('credentials', schemas.credentials);

/** Log out a user.
*
* Removes the session's user data.
*/
ctrl.put('/:sessionId/logout', function (req, res) {
  let session = sessions.byId(req.params('sessionId'));
  session.set({uid: null, userData: {}});
  sessions.replace(session);
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId);

/** Sign a payload.
*
* Creates a signature for the given payload.
*/
ctrl.post('/:sessionId/sign', function (req, res) {
  let session = sessions.byId(req.params('sessionId'));
  let signature = util.createSignature(
    session.get('secret'),
    req.params('payload')
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
  let payload = req.params('payload');
  let session = sessions.byId(req.params('sessionId'));
  let valid = util.verifySignature(
    session.get('secret'),
    payload,
    req.params('signature')
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
