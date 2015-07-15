/*global require, exports */
'use strict';
const joi = require('joi');
const util = require('./util');

exports.sessionId = joi.string().required()
.description('Session ID.');
exports.sessionData = joi.object()
.default(Object, 'empty object');
exports.incomingSession = joi.object()
.keys({sessionData: joi.object().default(Object, 'empty object')})
.description('Incoming session object.');
exports.credentials = joi.object()
.description('Login credentials.');
exports.signature = joi.string().required()
.description('A cryptographic signature.');
exports.signable = joi.object().required()
.description('Signable object payload.');

exports.session = joi.object()
.keys({
  _key: joi.string().default(util.generateSessionId, 'session ID'),
  sessionData: joi.object().default(Object, 'empty object'),
  userData: joi.object().default(Object, 'empty object'),
  uid: joi.string().allow(null).default(null),
  lastAccess: joi.number().integer().default(Date.now, 'current time'),
  lastUpdate: joi.number().integer().default(Date.now, 'current time'),
  created: joi.number().integer().default(Date.now, 'current time'),
  secret: joi.string().default(util.generateSessionSecret, 'session secret')
});
