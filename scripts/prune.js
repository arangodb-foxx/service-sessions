/*global require */
'use strict';
const qb = require('aqb');
const db = require('org/arangodb').db;
const sessions = require('./sessions');
const now = Date.now();

module.exports = db._query(
  qb.for('session').in(sessions.collection)
  .filter('session.expiry')
  .filter(qb.ref('session.expiry').lt(now))
  .remove('session').in(sessions.collection)
  .returnOld('x')
).toArray();
