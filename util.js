/*global require, exports, applicationContext */
'use strict';
const httperr = require('http-errors');
const request = require('org/arangodb/request');
const crypto = require('org/arangodb/crypto');

exports.generateSessionId = function () {
  return crypto.genRandomAlphaNumbers(applicationContext.configuration.sessionIdLength);
};
exports.generateSessionSecret = function () {
  return crypto.genRandomSalt(applicationContext.configuration.signingSecretLength);
};
exports.createSignature = function (secret, payload) {
  return crypto.hmac(
    secret,
    JSON.stringify(payload),
    applicationContext.configuration.signingAlgorithm
  );
};
exports.verifySignature = function (secret, payload, signature) {
  return crypto.constantEquals(exports.createSignature(secret, payload), signature);
};
exports.authenticate = function (username, password) {
  var res = request.put({
    url: applicationContext.configuration.usersRoot + '/' + username + '/authenticate',
    body: {password: password},
    json: true
  });
  if (res.status === 401 || res.status === 404) {
    throw new httperr.Unauthorized('Unknown username or password');
  }
  if (res.status >= 400) {
    throw new httperr.ServiceUnavailable(res.message);
  }
  return res.body;
};
exports.getExpiry = function () {
  return Date.now() + applicationContext.configuration.expiryDuration;
};
