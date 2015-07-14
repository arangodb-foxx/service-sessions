/*global require, exports, applicationContext */
'use strict';
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