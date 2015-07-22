/*global require, applicationContext */
'use strict';
const Foxx = require('org/arangodb/foxx');
const httperr = require('http-errors');
const schemas = require('./schemas');
const Session = require('./models').Session;
const sessions = require('./sessions');
const util = require('./util');
const ctrl = new Foxx.Controller(applicationContext);

/** Create a new session.
*
* Creates a new session in the database and returns it.
*/
ctrl.post('/', function (req, res) {
  const session = new Session();
  session.set(req.params('session'));
  sessions.save(session);
  res.json(session.forClient());
  res.status(201);
})
.bodyParam('session', schemas.incomingSession);

/** Get the session.
*
* Fetches a session from the database and returns it.
*/
ctrl.get('/:sessionId', function (req, res) {
  const session = sessions.byId(req.params('sessionId'));
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId);

/** Update the session.
*
* Replaces the session data of a session in the database
* or just updates its expiry if no session data is sent.
* Returns the updated session.
*/
ctrl.put('/:sessionId', function (req, res) {
  const sessionData = req.params('session').sessionData;
  let session;
  sessions.transaction(function () {
    session = sessions.byId(req.params('sessionId'));
    if (!sessionData) sessions.update(session);
    else {
      session.set('sessionData', sessionData);
      sessions.replace(session);
    }
  });
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
  const credentials = req.params('credentials');
  const userData = util.authenticate(credentials.username, credentials.password);
  let session;
  sessions.transaction(function () {
    session = sessions.byId(req.params('sessionId'));
    sessions.update(session, {uid: credentials.username, userData: userData});
  });
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId)
.bodyParam('credentials', schemas.credentials);

/** Log out a user.
*
* Clears the session's user data.
*/
ctrl.put('/:sessionId/logout', function (req, res) {
  let session;
  sessions.transaction(function () {
    session = sessions.byId(req.params('sessionId'));
    session.set({uid: null, userData: {}});
    sessions.replace(session);
  });
  res.json(session.forClient());
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId);

/** Sign a payload.
*
* Creates a signature for the given payload.
*/
ctrl.post('/:sessionId/sign', function (req, res) {
  const session = sessions.byId(req.params('sessionId'));
  const signature = util.createSignature(
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
  const session = sessions.byId(req.params('sessionId'));
  const payload = req.params('payload');
  const valid = util.verifySignature(
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
