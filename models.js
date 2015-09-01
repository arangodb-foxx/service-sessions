/*global require, exports */
'use strict';
const _ = require('underscore');
const Foxx = require('org/arangodb/foxx');
const schemas = require('./schemas');

exports.Session = Foxx.Model.extend({
  schema: schemas.session,
  forClient() {
    var data = Foxx.Model.prototype.forClient.call(this);
    return _.omit(data, 'secret', 'nonces');
  }
});
