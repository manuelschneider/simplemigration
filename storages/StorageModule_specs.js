(function() {
  var assert, storage, _i, _len, _ref;

  assert = require("should");

  _ref = require("fs").readdirSync(__dirname);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    storage = _ref[_i];
    if (!require("fs").statSync("" + __dirname + "/" + storage).isDirectory()) {
      continue;
    }
    describe(storage, function() {
      var adminConfig, configDescription, dbConfig, inst;
      configDescription = "default config, ";
      dbConfig = JSON.parse(require("fs").readFileSync("" + __dirname + "/" + storage + "/fixtures/config.json", "utf-8"));
      if (dbConfig.user != null) {
        configDescription += "authenticated app-user, ";
      } else {
        configDescription += "no authentication, ";
      }
      adminConfig = null;
      if (require("fs").existsSync("" + __dirname + "/" + storage + "/fixtures/admin.json")) {
        adminConfig = JSON.parse(require("fs").readFileSync("" + __dirname + "/" + storage + "/fixtures/admin.json", "utf-8"));
      }
      if (adminConfig != null) {
        configDescription += "with admin-user";
      } else {
        configDescription += "no admin-user";
      }
      inst = new (require("" + __dirname + "/" + storage + "/index"))(dbConfig, adminConfig);
      it("can be instanciated (" + configDescription + ")", function() {
        inst.should.be.type("object");
        inst.should.have.property("appConnection", null);
        inst.should.have.property("adminConnection", null);
        inst.should.have.property("connect")["with"].type("function");
        inst.should.have.property("execute")["with"].type("function");
        inst.should.have.property("dump")["with"].type("function");
        inst.should.have.property("restoreDump")["with"].type("function");
        inst.should.have.property("createDbIfNotExists")["with"].type("function");
        inst.should.have.property("createUserIfNotExists")["with"].type("function");
        inst.should.have.property("purgeDbIfExists")["with"].type("function");
        inst.should.have.property("purgeUserIfExists")["with"].type("function");
        inst.should.have.property("getVersion")["with"].type("function");
        return inst.should.have.property("setVersion")["with"].type("function");
      });
      return describe("->connect()", function() {
        var callbacks;
        callbacks = [];
        if ((adminConfig != null) && (dbConfig.user != null)) {
          it("returns false because the app-user does not exist yet", function(done) {
            return inst.connect((function(done, result) {
              result.should.be["false"];
              return done();
            }).bind(null, done));
          });
          it("should have connected the admin connection", function() {
            return inst.should.have.property("adminConnection").not.equal(null).and.type("object");
          });
          it("shouldn't have connected the app connection", function() {
            return inst.should.have.property("appConnection", null);
          });
        } else if ((adminConfig != null) && (dbConfig.user == null)) {
          it("returns true because the app-user doesn't count", function(done) {
            return inst.connect((function(done, result) {
              result.should.be["true"];
              return done();
            }).bind(null, done));
          });
          it("should have connected the admin connection", function() {
            return inst.should.have.property("adminConnection").not.equal(null).and.type("object");
          });
          it("should have connected the app connection", function() {
            return inst.should.have.property("appConnection").not.equal(null).and.type("object");
          });
        } else if ((adminConfig == null) && (dbConfig.user == null)) {
          it("returns true because the app-user doesn't count", function(done) {
            return inst.connect((function(done, result) {
              result.should.be["true"];
              return done();
            }).bind(null, done));
          });
          it("shouldn't have connected an admin connection", function() {
            return inst.should.have.property("adminConnection", null);
          });
          it("should have connected the app connection", function() {
            return inst.should.have.property("appConnection").not.equal(null).and.type("object");
          });
        } else if ((adminConfig == null) && (dbConfig.user != null)) {
          it("returns false because the app-user does not exist yet", function(done) {
            return inst.connect((function(done, result) {
              result.should.be["false"];
              return done();
            }).bind(null, done));
          });
          it("shouldn't have connected an admin connection", function() {
            return inst.should.have.property("adminConnection", null);
          });
          it("shouldn't have connected the app connection", function() {
            return inst.should.have.property("appConnection", null);
          });
        }
        return describe("->createDbIfNotExists()", function() {
          it("does not fail", function(done) {
            return inst.createDbIfNotExists((function(done, result) {
              (typeof result).should.be.exactly('undefined');
              return done();
            }).bind(null, done));
          });
          return describe("->getVersion()", function() {
            it("returns the version -1 (empty)", function(done) {
              return inst.getVersion((function(done, result) {
                result.should.be.exactly(-1);
                return done();
              }).bind(this, done));
            });
            return describe("->setVersion(5)", function() {
              it('does not fail', function(done) {
                return inst.setVersion((function(done, result) {
                  (typeof result).should.be.exactly('undefined');
                  return done();
                }).bind(this, done), 5);
              });
              return describe("->getVersion()", function() {
                it("returns the version 5, so our db exists (version shall be saved in it)", function(done) {
                  return inst.getVersion((function(done, result) {
                    result.should.be.exactly(5);
                    return done();
                  }).bind(this, done));
                });
                return describe("->createUserIfNotExists()", function() {
                  it("does not fail", function(done) {
                    return inst.createUserIfNotExists((function(done, result) {
                      (typeof result).should.be.exactly('undefined');
                      return done();
                    }).bind(null, done));
                  });
                  it("should have connected the app connection", function() {
                    return inst.should.have.property("appConnection").not.equal(null).and.type("object");
                  });
                  describe("->execute(workingMigration.js)", function() {
                    it("does not fail", function(done) {
                      return inst.execute((function(done, result) {
                        (typeof result).should.be.exactly('undefined');
                        return done();
                      }).bind(this, done), "" + __dirname + "/" + storage + "/fixtures/workingMigrations/0.js");
                    });
                    return it("does the job", function(done) {
                      return inst.execute((function(done, result) {
                        (typeof result).should.be.exactly('undefined');
                        return done();
                      }).bind(this, done), "" + __dirname + "/" + storage + "/fixtures/queryWorkingMigration0.js");
                    });
                  });
                  describe("->execute(invalidMigration.js)", function() {
                    return it("fails properly with an error", function(done) {
                      return inst.execute((function(done, result) {
                        result.should.be["instanceof"](Error);
                        return done();
                      }).bind(this, done), "" + __dirname + "/" + storage + "/fixtures/defectMigrations/1.js");
                    });
                  });
                  describe("->restoreDump(someBigDump)", function() {
                    it("does not fail", function(done) {
                      return inst.restoreDump((function(done, result) {
                        (typeof result).should.be.exactly('undefined');
                        return done();
                      }).bind(this, done), "" + __dirname + "/" + storage + "/fixtures/dump");
                    });
                    return describe("->dump()", function() {
                      var dumpmeta;
                      dumpmeta = {
                        dir: null
                      };
                      it("does not fail", function(done) {
                        return inst.dump((function(done, dumpdir) {
                          dumpdir.should.be.type("string").and.startWith("simple" + "MigrationMongoDump.simpleMigration_testbench.20");
                          dumpmeta.dir = dumpdir;
                          return done();
                        }).bind(this, done));
                      });
                      return it("is equivalent to someBigDump", function(done) {
                        var cmd;
                        cmd = ("diff -r -x system.indexes.bson -x *.metadata.json " + dumpmeta.dir + " ") + ("" + __dirname + "/" + storage + "/fixtures/dump");
                        return require('child_process').exec(cmd, (function(done, err, stdout, stderr) {
                          if (err != null) {
                            console.log(stdout, stderr);
                          }
                          (err === null).should.be["true"];
                          require("wrench").rmdirSyncRecursive(dumpmeta.dir);
                          return done();
                        }).bind(this, done));
                      });
                    });
                  });
                  return describe("->purgeUserIfExists()", function() {
                    it("does not fail", function(done) {
                      return inst.purgeUserIfExists((function(done, result) {
                        (typeof result).should.be.exactly('undefined');
                        return done();
                      }).bind(null, done));
                    });
                    if (dbConfig.user != null) {
                      it("should have not connected the app connection any longer", function() {
                        return inst.should.have.property("appConnection", null);
                      });
                    }
                    return describe("->purgeDbIfExists()", function() {
                      it("does not fail", function(done) {
                        return inst.purgeDbIfExists((function(done, result) {
                          (typeof result).should.be.exactly('undefined');
                          return done();
                        }).bind(null, done));
                      });
                      return describe("->getVersion()", function() {
                        return it("produces an error now (db does not exist)", function(done) {
                          return inst.getVersion((function(done, result) {
                            result.should.be["instanceof"](Error);
                            return done();
                          }).bind(this, done));
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

}).call(this);

//# sourceMappingURL=../storages/StorageModule_specs.js.map
