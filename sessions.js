/*global require, module, applicationContext */
'use strict';
const NotFound = require('http-errors').NotFound;
const arangodb = require('org/arangodb');
const Foxx = require('org/arangodb/foxx');
const Session = require('./models').Session;
const util = require('./util');

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
    if (data.expiry && Date.now() > data.expiry) {
      this.remove(id);
      throw new NotFound();
    }
    return new this.model(data);
  },
  setUser(model, uid, userData) {
    model.set({uid: uid, userData: userData});
    return this.replace(model);
  },
  replace(model) {
    model.set('expiry', util.getExpiry());
    return Foxx.Repository.prototype.replace.call(this, model);
  },
  update(model, data) {
    if (!data) data = {};
    data.expiry = util.getExpiry();
    return Foxx.Repository.prototype.update.call(this, model, data);
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
  },
  transaction(fn) {
    arangodb.db._executeTransaction({
      collections: {
        write: this.collection.name()
      },
      action: fn
    });
  }
});
module.exports = new Repository(
  applicationContext.collection('sessions'),
  {model: Session}
);
