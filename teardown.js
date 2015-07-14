/*global require, applicationContext */
'use strict';
var db = require('org/arangodb').db;
var name = applicationContext.collectionName('sessions');
if (db._exists(name)) db._collection(name).drop();