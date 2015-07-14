/*global require, module, applicationContext */
'use strict';
const NotFound = require('http-errors').NotFound;
const arangodb = require('org/arangodb');
const Foxx = require('org/arangodb/foxx');
const Session = require('./models').Session;
const Repository = Foxx.Repository.extend({
  byId(id) {
    let data;
    try {
      data = this.collection.document(id);
    } catch (e) {
      if (
        e instanceof arangodb.ArangoError
        && e.errorNum === arangodb.errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
      ) throw new NotFound();
      else throw e;
    }
    let model = new this.model(data);
    let now = Date.now();
    model.set('lastAccessed', now);
    this.collection.update(data, {lastAccessed: now});
    return model;
  },
  save(model) {
    model.set('lastUpdated', Date.now());
    return Foxx.Repository.prototype.save.call(this, model);
  },
  remove(id) {
    try {
      this.collection.remove(id);
    } catch (e) {
      if (
        e instanceof arangodb.ArangoError
        && e.errorNum === arangodb.errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
      ) return false;
      else throw e;
    }
    return true;
  }
});
module.exports = new Repository(
  applicationContext.collection('sessions'),
  {model: Session}
);