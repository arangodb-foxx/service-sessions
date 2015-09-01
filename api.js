/*global require, applicationContext */
'use strict';
const querystring = require('querystring');
const httperr = require('http-errors');
const Foxx = require('org/arangodb/foxx');
const crypto = require('org/arangodb/crypto');
const schemas = require('./schemas');
const Session = require('./models').Session;
const sessions = require('./sessions');
const util = require('./util');
const ctrl = new Foxx.Controller(applicationContext);
const oauth2 = applicationContext.dependencies.oauth2;

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

if (applicationContext.configuration.usersRoot) {
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
}

if (applicationContext.configuration.usersRoot || oauth2) {
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
}

if (oauth2) {
  let publicUrl = applicationContext.configuration.publicUrl;
  if (publicUrl && publicUrl.charAt(publicUrl.length - 1) !== '/') publicUrl += '/';

  /** Log in with OAuth2.
  *
  * Redirects to the OAuth2 provider's authentication endpoint.
  */
  ctrl.get('/:sessionId/oauth2', function (req, res) {
    if (!publicUrl) throw new httperr.InternalServerError('"publicUrl" not configured');
    let sessionId = req.params('sessionId');
    let session = sessions.byId(sessionId);
    res.set('location', oauth2.getAuthUrl(publicUrl + 'oauth2-login?' + querystring.stringify({
      sessionId: sessionId,
      signature: util.createSignature(session.get('secret'), sessionId)
    })));
    res.status(303);
  })
  .pathParam('sessionId', schemas.sessionId);

  /** OAuth2 endpoint.
  *
  * Verifies the OAuth2 authentication.
  */
  ctrl.get('/oauth2-login', function (req, res) {
    if (!publicUrl) throw new httperr.InternalServerError('"publicUrl" not configured');
    let sessionId = req.params('sessionId');
    let session = sessions.byId(sessionId);
    let signature = req.params('signature');
    let valid = util.verifySignature(session.get('secret'), sessionId, signature);
    if (!valid) throw new httperr.BadRequest('Signature mismatch');
    let authData = oauth2.exchangeGrantToken(req.params('code'), publicUrl + 'oauth2-login');
    let profile = oauth2.fetchActiveUser(authData.access_token);
    sessions.update(session, {userData: profile, uid: 'oauth2/' + authData.access_token});
    res.set('location', publicUrl + sessionId);
    res.status(303);
  })
  .queryParam('code', schemas.oauth2GrantToken)
  .queryParam('signature', schemas.signature)
  .queryParam('sessionId', schemas.sessionId);
}

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

/** Creates a new nonce.
*
* Creates a cryptographic nonce.
*/
ctrl.post('/:sessionId/nonce', function (req, res) {
  sessions.byId(req.params('sessionId'));
  let nonce = crypto.createNonce();
  res.json({nonce});
  res.status(201);
})
.pathParam('sessionId', schemas.sessionId);

/** Reads and uses a nonce.
*
* Returns true if the nonce was valid.
*/
ctrl.put('/:sessionId/nonce/:nonce', function (req, res) {
  sessions.byId(req.params('sessionId'));
  let nonce = req.params('nonce');
  let valid = crypto.checkAndMarkNonce(nonce);
  res.json({valid});
  res.status(200);
})
.pathParam('sessionId', schemas.sessionId)
.pathParam('nonce', schemas.nonce);
