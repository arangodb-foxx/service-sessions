/*global require, applicationContext */
'use strict';
var qb = require('aqb');
var db = require('org/arangodb').db;
var collection = applicationContext.collection('sessions');
var expiryType = applicationContext.configuration.expiryType;
var timeout = applicationContext.configuration.expiryDuration * 1000;
var now = Date.now();
module.exports = db._query(
  qb.for('session').in(collection)
  .filter(qb.get('session', qb(expiryType)).plus(timeout).lt(now))
  .remove('session').in(collection)
  .returnOld('x')
).toArray();
