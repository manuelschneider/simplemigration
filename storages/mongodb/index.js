(function() {
  var MongodbStorage, StorageModule, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  StorageModule = require("../StorageModule");

  /*
      NOTES:
          When you use --auth, a 'superuser' is required as admin:
              db.addUser({ user: "admin", pwd: "topsecret", roles: [
                  "readWrite", "dbAdmin", "userAdmin", "readWriteAnyDatabase",
                  "userAdminAnyDatabase", "dbAdminAnyDatabase", "clusterAdmin"
              ] })
  */


  MongodbStorage = (function(_super) {
    __extends(MongodbStorage, _super);

    function MongodbStorage() {
      _ref = MongodbStorage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    MongodbStorage.prototype.connect = function(cb) {
      var MongoClient, connects, uri,
        _this = this;
      if (this.appConnection != null) {
        this.appConnection.close();
        this.appConnection = null;
      }
      if (this.adminConnection != null) {
        this.adminConnection.close();
        this.adminConnection = null;
      }
      MongoClient = require('mongodb').MongoClient;
      uri = "mongodb://" + this._config.host + ":" + this._config.port + "/" + this._config.schema;
      connects = {
        admin: null,
        app: null,
        failed: false
      };
      MongoClient.connect(uri, (function(cb, err, db) {
        var finalCheck;
        if (err != null) {
          if (!connects.failed) {
            cb(false);
          }
          connects.failed = true;
          return;
        }
        _this.appConnection = db;
        finalCheck = (function(cb, err, res) {
          if (err != null) {
            if (_this.appConnection != null) {
              _this.appConnection.close();
              _this.appConnection = null;
            }
            connects.app = false;
            if (!connects.failed) {
              cb(false);
            }
            connects.failed = true;
            return;
          }
          if (!connects.failed) {
            return _this.appConnection.collectionNames({
              namesOnly: true
            }, (function(cb, err, list) {
              if ((err == null) && list instanceof Array) {
                connects.app = true;
                if (connects.admin != null) {
                  if (!connects.failed) {
                    cb(true);
                  }
                }
                return;
              }
              connects.app = false;
              if (this.appConnection != null) {
                this.appConnection.close();
                this.appConnection = null;
              }
              if (!connects.failed) {
                cb(false);
              }
              return connects.failed = true;
            }).bind(_this, cb));
          }
        }).bind(_this, cb);
        if (_this._config.user != null) {
          return _this.appConnection.authenticate(_this._config.user, _this._config.pw, finalCheck);
        } else {
          return finalCheck();
        }
      }).bind(this, cb));
      if (this._admin != null) {
        return MongoClient.connect(uri, (function(cb, err, db) {
          var finalCheck;
          if (err != null) {
            if (!connects.failed) {
              cb(false);
            }
            connects.failed = true;
            return;
          }
          _this.adminConnection = db;
          finalCheck = (function(cb, err, res) {
            if (err != null) {
              console.log(err);
              if (_this.adminConnection != null) {
                _this.adminConnection.close();
                _this.adminConnection = null;
              }
              connects.admin = false;
              if (!connects.failed) {
                cb(false);
              }
              connects.failed = true;
              return;
            }
            if (!connects.failed) {
              return _this.adminConnection.collectionNames({
                namesOnly: true
              }, (function(cb, err, list) {
                if ((err == null) && list instanceof Array) {
                  connects.admin = true;
                  if (connects.app != null) {
                    if (!connects.failed) {
                      cb(true);
                    }
                  }
                  return;
                }
                connects.admin = false;
                if (this.adminConnection != null) {
                  this.adminConnection.close();
                  this.adminConnection = null;
                }
                if (!connects.failed) {
                  cb(false);
                }
                return connects.failed = true;
              }).bind(_this, cb));
            }
          }).bind(_this, cb);
          return _this.adminConnection.admin().authenticate(_this._admin.user, _this._admin.pw, finalCheck);
        }).bind(this, cb));
      } else {
        return connects.admin = true;
      }
    };

    MongodbStorage.prototype.execute = function(cb, migration) {
      return (require(migration))((function(cb, res) {
        if (res != null) {
          if (res instanceof Error) {
            return cb(res);
          } else {
            return cb(new Error(res));
          }
        } else {
          return cb();
        }
      }).bind(this, cb), this.appConnection);
    };

    MongodbStorage.prototype.dump = function(cb, dumpToDir) {
      var cmd, date;
      if (dumpToDir == null) {
        dumpToDir = null;
      }
      date = new Date();
      if (dumpToDir == null) {
        dumpToDir = "simpleMigrationMongoDump." + this._config.schema + "." + (date.toISOString());
      }
      cmd = "mongodump --host " + this._config.host + ":" + this._config.port + " --out " + dumpToDir + " --db " + this._config.schema;
      if (this._admin != null) {
        cmd += " --username '" + this._admin.user + "' --password '" + this._admin.pw + "'";
        cmd += " --authenticationDatabase admin";
      } else if ((this._config.user != null) && (this.appConnection != null)) {
        cmd += " --username '" + this._config.user + "' --password '" + this._config.pw + "'";
      } else if (this._config.user != null) {
        cb(new Error("a dump does not work without working app-creds or admin-creds!"));
        return;
      }
      return require('child_process').exec(cmd, (function(cb, dumpToDir, err, stdout, stderr) {
        if (err != null) {
          return cb(err);
        } else {
          return cb(dumpToDir);
        }
      }).bind(this, cb, dumpToDir));
    };

    MongodbStorage.prototype.restoreDump = function(cb, dumpDir) {
      var _this = this;
      return this.purgeDbIfExists((function(cb, dumpDir, err) {
        var cmd;
        if (err != null) {
          return cb(err);
        } else {
          cmd = "mongorestore --host " + _this._config.host + " --port " + _this._config.port + " --db " + _this._config.schema;
          if (_this._admin != null) {
            cmd += " --username '" + _this._admin.user + "' --password '" + _this._admin.pw + "'";
            cmd += " --authenticationDatabase admin";
          } else if (_this._config.user != null) {
            cb(new Error("a restore does not work without admin creds!"));
            return;
          }
          cmd += " " + dumpDir + "/" + _this._config.schema;
          return require('child_process').exec(cmd, (function(cb, err, stdout, stderr) {
            if (err != null) {
              return cb(err);
            } else {
              return cb();
            }
          }).bind(_this, cb));
        }
      }).bind(this, cb, dumpDir));
    };

    MongodbStorage.prototype.createDbIfNotExists = function(cb) {
      var connection,
        _this = this;
      if (this._admin != null) {
        connection = this.adminConnection;
      } else {
        connection = this.appConnection;
      }
      return connection.collectionNames((function(cb, err, list) {
        if (__indexOf.call(list, "___simpleMigrationVersion") < 0) {
          return connection.createCollection("___simpleMigrationVersion", (function(cb, err, res) {
            if (err != null) {
              cb(err);
              return;
            }
            if (!res) {
              cb(new Error("something went wrong"));
              return;
            }
            return connection.collection("___simpleMigrationVersion", (function(cb, err, collection) {
              if (err != null) {
                cb(err);
                return;
              }
              return collection.insert({
                "version": -1
              }, {
                w: 1
              }, (function(cb, err, res) {
                if (err != null) {
                  cb(err);
                  return;
                }
                if (!res) {
                  cb(new Error("something went wrong"));
                  return;
                }
                return cb();
              }).bind(this, cb));
            }).bind(this, cb));
          }).bind(_this, cb));
        } else {
          return cb();
        }
      }).bind(this, cb));
    };

    MongodbStorage.prototype.createUserIfNotExists = function(cb) {
      if (this._config.user != null) {
        return this.adminConnection.collection("system.users", (function(cb, err, col) {
          if (err != null) {
            cb(err);
            return;
          }
          return col.find().toArray((function(cb, err, docs) {
            var _ref1;
            if (err != null) {
              cb(err);
              return;
            }
            if (_ref1 = this._config.user, __indexOf.call(docs, _ref1) < 0) {
              return this.adminConnection.addUser(this._config.user, this._config.pw, {
                w: 1,
                roles: ["readWrite"]
              }, (function(cb, err, res) {
                if (err != null) {
                  cb(err);
                  return;
                }
                if (!res) {
                  cb(new Error("something went wrong"));
                  return;
                }
                return this.connect((function(cb, res) {
                  if (res) {
                    cb();
                    return;
                  }
                  return cb(new Error("connect failed"));
                }).bind(this, cb));
              }).bind(this, cb));
            } else {
              return cb();
            }
          }).bind(this, cb));
        }).bind(this, cb));
      } else {
        return cb();
      }
    };

    MongodbStorage.prototype.purgeDbIfExists = function(cb) {
      var connection;
      if (this._admin != null) {
        connection = this.adminConnection;
      } else {
        connection = this.appConnection;
      }
      return connection.dropDatabase((function(cb, err, res) {
        if (err != null) {
          cb(err);
          return;
        }
        if (!res) {
          cb(new Error("something went wrong"));
          return;
        }
        return cb();
      }).bind(this, cb));
    };

    MongodbStorage.prototype.purgeUserIfExists = function(cb) {
      var connection;
      if (this._admin != null) {
        connection = this.adminConnection;
      } else {
        connection = this.appConnection;
      }
      if (this._config.user != null) {
        return connection.removeUser(this._config.user, (function(cb, err, res) {
          if (err != null) {
            cb(err);
            return;
          }
          if (!res) {
            cb(new Error("something went wrong"));
            return;
          }
          this.appConnection.close();
          this.appConnection = null;
          return cb();
        }).bind(this, cb));
      } else {
        return cb();
      }
    };

    MongodbStorage.prototype.getVersion = function(cb) {
      var connection;
      if (this._admin != null) {
        connection = this.adminConnection;
      } else {
        connection = this.appConnection;
      }
      return connection.collection("___simpleMigrationVersion", (function(cb, err, col) {
        if (err != null) {
          cb(err);
          return;
        }
        return col.findOne((function(cb, err, item) {
          if (err != null) {
            cb(err);
            return;
          }
          if ((item != null ? item.version : void 0) != null) {
            cb(item.version);
            return;
          }
          return cb(new Error("something went wrong"));
        }).bind(this, cb));
      }).bind(this, cb));
    };

    MongodbStorage.prototype.setVersion = function(cb, newVersion) {
      var connection;
      if (this._admin != null) {
        connection = this.adminConnection;
      } else {
        connection = this.appConnection;
      }
      return connection.collection("___simpleMigrationVersion", (function(cb, newVersion, err, col) {
        if (err != null) {
          cb(err);
          return;
        }
        return col.findOne((function(cb, newVersion, col, err, item) {
          if (err != null) {
            cb(err);
            return;
          }
          if (item.version == null) {
            cb(new Error("something went wrong"));
            return;
          }
          return col.update({
            version: item.version
          }, {
            $set: {
              version: newVersion
            }
          }, {
            w: 1
          }, (function(cb, err, res) {
            if (err != null) {
              cb(err);
              return;
            }
            if (!res) {
              cb(new Error("something went wrong"));
              return;
            }
            return cb();
          }).bind(this, cb));
        }).bind(this, cb, newVersion, col));
      }).bind(this, cb, newVersion));
    };

    return MongodbStorage;

  })(StorageModule);

  module.exports = MongodbStorage;

}).call(this);

//# sourceMappingURL=../../storages/mongodb/index.js.map

/*! simplemigration - v0.0.0 - 2014-03-19
* https://github.com/manuelschneider/simplemigration
* Copyright (c) 2014 Manuel Schneider; All rights reserved. */
require('source-map-support').install();