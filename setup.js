/*global require, applicationContext */
'use strict';
var db = require('org/arangodb').db;
var name = applicationContext.collectionName('sessions');
if (!db._collection(name)) db._createDocumentCollection(name);