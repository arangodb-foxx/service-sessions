/*global require, exports */
'use strict';
const joi = require('joi');
const util = require('./util');

exports.sessionId = joi.string().required()
.description('Session ID.');
exports.sessionData = joi.object()
.default(Object, 'empty object');
exports.incomingSession = joi.object()
.keys({sessionData: joi.object().optional()})
.description('Incoming session object.');
exports.credentials = joi.object().required()
.keys({
  username: joi.string().required(),
  password: joi.string().required()
})
.description('Login credentials.');
exports.signature = joi.string().required()
.description('A cryptographic signature.');
exports.signable = joi.object().required()
.description('Signable object payload.');
exports.nonce = joi.string().required()
.description('A cryptographic nonce.');
exports.oauth2GrantToken = joi.string().required()
.description('OAuth2 Grant Token');

exports.session = joi.object()
.keys({
  _key: joi.string().default(util.generateSessionId, 'session ID'),
  sessionData: joi.object().default(Object, 'empty object'),
  userData: joi.object().default(Object, 'empty object'),
  uid: joi.string().allow(null).default(null),
  expiry: joi.number().integer().default(util.getExpiry, 'session timeout'),
  secret: joi.string().default(util.generateSessionSecret, 'session secret')
});
