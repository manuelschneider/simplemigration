(function() {
  var StorageModule;

  StorageModule = (function() {
    StorageModule.prototype.appConnection = null;

    StorageModule.prototype.adminConnection = null;

    StorageModule.prototype._config = null;

    StorageModule.prototype._admin = null;

    function StorageModule(config, admin) {
      if (admin == null) {
        admin = null;
      }
      this._config = config;
      this._admin = admin;
    }

    StorageModule.prototype.connect = function(cb) {
      return cb(false);
    };

    StorageModule.prototype.execute = function(cb, migration) {
      return cb();
    };

    StorageModule.prototype.dump = function(cb, dumpTo) {
      if (dumpTo == null) {
        dumpTo = null;
      }
      return cb("");
    };

    StorageModule.prototype.restoreDump = function(cb, dump) {
      return cb();
    };

    StorageModule.prototype.createDbIfNotExists = function(cb) {
      return cb();
    };

    StorageModule.prototype.createUserIfNotExists = function(cb) {
      return cb();
    };

    StorageModule.prototype.purgeDbIfExists = function(cb) {
      return cb();
    };

    StorageModule.prototype.purgeUserIfExists = function(cb) {
      return cb();
    };

    StorageModule.prototype.getVersion = function(cb) {
      return cb(-1);
    };

    StorageModule.prototype.setVersion = function(cb, version) {
      return cb();
    };

    return StorageModule;

  })();

  module.exports = StorageModule;

}).call(this);

//# sourceMappingURL=../storages/StorageModule.js.map

/*! simplemigration - v0.0.0 - 2014-03-19
* https://github.com/manuelschneider/simplemigration
* Copyright (c) 2014 Manuel Schneider; All rights reserved. */
require('source-map-support').install();