(function() {
  var SimpleMigration;

  SimpleMigration = (function() {
    SimpleMigration.prototype._storage = null;

    /**
     * initialize the simple migrator
     * @param  {object;props:{
     *             type: enum(values:[mongodb]),
     *             host: name
     *             port: positive
     *             schema: name
     *             user: null|name
     *             pw: null|pw
     *           }} dbConfig    the config by which the app can connect to the database
     * @param  {null|object;props:{
     *             user: null|name
     *             pw: null|pw
     *           }} adminAccess   the administrative account for the database (if required)
    */


    function SimpleMigration(dbConfig, adminAccess) {
      if (adminAccess == null) {
        adminAccess = null;
      }
      this._storage = new (require("" + __dirname + "/storages/" + dbConfig.type + "/index"))(dbConfig, adminAccess);
    }

    /**
     * test if the user from the conf can connect to the db in the conf
     * @param {callback}  cb
     * @return {bool}  true if it works
    */


    SimpleMigration.prototype.isAccessable = function(cb) {
      return this._storage.connect(cb);
    };

    /**
     * create db (and user) if it doesn't exist
    */


    SimpleMigration.prototype.createIfNotExists = function(cb) {
      var _this = this;
      return this._storage.createDbIfNotExists((function(cb) {
        return _this._storage.createUserIfNotExists(cb);
      }).bind(this, cb));
    };

    /**
     * purge db (and user) including all the data if it exists.
    */


    SimpleMigration.prototype.purgeIfExists = function(cb) {
      return this._storage.purgeUserIfExists((function(cb) {
        return this._storage.purgeDbIfExists(cb);
      }).bind(this, cb));
    };

    /**
     * test if all migrations have been applied
     * @param {dirname} migrations  a dir containing the required migrations for the data
     * @return {bool}  true if yes
    */


    SimpleMigration.prototype.isUptodate = function(cb, migrations) {
      var uniqueMigrations;
      uniqueMigrations = require("fs").readdirSync(migrations);
      return this._storage.getVersion((function(cb, version) {
        return cb(version === (uniqueMigrations.length - 1));
      }).bind(null, cb));
    };

    /**
     * apply all missing migrations (if any)
     * @param {dirname} migrations  a dir containing the required migrations for the data
    */


    SimpleMigration.prototype.apply = function(cb, migrations) {
      var uniqueMigrations,
        _this = this;
      uniqueMigrations = require("fs").readdirSync(migrations).sort();
      return this._storage.getVersion((function(cb, migrations, version) {
        var i, _i;
        if (version instanceof Error) {
          cb(version);
          return;
        }
        if (version >= 0) {
          for (i = _i = 0; 0 <= version ? _i <= version : _i >= version; i = 0 <= version ? ++_i : --_i) {
            uniqueMigrations.shift();
          }
        }
        if (uniqueMigrations.length > 0) {
          return _this._applyMigration(migrations, uniqueMigrations, version, cb);
        } else {
          return cb();
        }
      }).bind(this, cb, migrations));
    };

    /**
     * A shorthand for create, apply and isAccessable/isUptodate
     * @param {dirname} migrations  a dir containing the required migrations for the data
    */


    SimpleMigration.prototype.ensureReadiness = function(cb, migrations) {
      var _this = this;
      return this.createIfNotExists((function(cb, migrations, res) {
        if ((res != null) && res instanceof Error) {
          cb(res);
          return;
        }
        return _this.apply((function(cb, migrations, res) {
          if ((res != null) && res instanceof Error) {
            cb(res);
            return;
          }
          return cb();
        }).bind(null, cb, migrations), migrations);
      }).bind(this, cb, migrations));
    };

    /**
     * dump the complete database
     * @param  {filename} outfile
    */


    SimpleMigration.prototype.backup = function(cb, outfile) {
      if (outfile == null) {
        outfile = null;
      }
      return this._storage.dump(cb, outfile);
    };

    /**
     * purge the complete database and restore the given dump
     * @param  {filename} infile
    */


    SimpleMigration.prototype.restore = function(cb, infile) {
      return this._storage.restoreDump(cb, infile);
    };

    SimpleMigration.prototype._applyMigration = function(dir, migrations, migrationId, cb) {
      var _this = this;
      return this._storage.dump((function(cb, dir, migrations, migrationId, dumpfile) {
        if (dumpfile instanceof Error) {
          cb(dumpfile);
          return;
        }
        return _this._storage.execute((function(cb, dir, migrations, migrationId, dumpfile, res) {
          if ((res != null) && res instanceof Error) {
            _this._storage.restoreDump((function(cb) {
              require("wrench").rmdirSyncRecursive(dumpfile);
              return cb();
            }).bind(null, cb.bind(null, res)), dumpfile);
            return;
          }
          migrations.shift();
          migrationId++;
          return _this._storage.setVersion((function(cb, dir, migrations, dumpfile, migrationId, res) {
            if ((res != null) && res instanceof Error) {
              _this._storage.restoreDump((function(cb) {
                require("wrench").rmdirSyncRecursive(dumpfile);
                return cb();
              }).bind(null, cb.bind(null, res)), dumpfile);
              return;
            }
            if (migrations.length > 0) {
              if (require("fs").statSync(dumpfile).isDirectory()) {
                require("wrench").rmdirSyncRecursive(dumpfile);
              } else {
                require("fs").unlinkSync(dumpfile);
              }
              return _this._applyMigration(dir, migrations, migrationId, cb);
            } else {
              return cb();
            }
          }).bind(_this, cb, dir, migrations, dumpfile, migrationId), migrationId);
        }).bind(_this, cb, dir, migrations, migrationId, dumpfile), "" + dir + "/" + migrations[0]);
      }).bind(this, cb, dir, migrations, migrationId));
    };

    return SimpleMigration;

  })();

  module.exports = SimpleMigration;

}).call(this);

//# sourceMappingURL=.././SimpleMigration.js.map

/*! simplemigration - v0.0.1 - 2014-03-19
* https://github.com/manuelschneider/simplemigration
* Copyright (c) 2014 Manuel Schneider; All rights reserved. */
require('source-map-support').install();