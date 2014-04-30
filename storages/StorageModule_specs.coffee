assert = require("should")

for storage in require("fs").readdirSync(__dirname)
    continue unless require("fs").statSync("#{__dirname}/#{storage}").isDirectory()

    describe storage, ->

        configDescription = "default config, "

        dbConfig = JSON.parse(
            require("fs").readFileSync("#{__dirname}/#{storage}/fixtures/config.json",
                "utf-8"))
        if dbConfig.user?
            configDescription += "authenticated app-user, "
        else
            configDescription += "no authentication, "

        adminConfig = null
        if require("fs").existsSync("#{__dirname}/#{storage}/fixtures/admin.json")
            adminConfig = JSON.parse(
                require("fs").readFileSync("#{__dirname}/#{storage}/fixtures/admin.json",
                    "utf-8"))

        if adminConfig?
            configDescription += "with admin-user"
        else
            configDescription += "no admin-user"

        inst = new (require("#{__dirname}/#{storage}/index"))(dbConfig, adminConfig)

        it "can be instanciated (#{configDescription})", ->
            inst.should.be.type("object")

            inst.should.have.property("appConnection", null)
            inst.should.have.property("adminConnection", null)

            inst.should.have.property("connect").with.type("function")
            inst.should.have.property("execute").with.type("function")
            inst.should.have.property("dump").with.type("function")
            inst.should.have.property("restoreDump").with.type("function")
            inst.should.have.property("createDbIfNotExists").with.type("function")
            inst.should.have.property("createUserIfNotExists").with.type("function")
            inst.should.have.property("purgeDbIfExists").with.type("function")
            inst.should.have.property("purgeUserIfExists").with.type("function")
            inst.should.have.property("getVersion").with.type("function")
            inst.should.have.property("setVersion").with.type("function")

        describe "->connect()", ->

            callbacks = []

            if adminConfig? and dbConfig.user?
                it "returns false because the app-user does not exist yet", ( done ) ->
                    inst.connect((( done, result ) ->
                        result.should.be.false
                        done()
                    ).bind(null, done))

                it "should have connected the admin connection", ->
                    inst.should.have.property("adminConnection").not.equal(null).and.type("object")

                it "shouldn't have connected the app connection", ->
                    inst.should.have.property("appConnection", null)

            else if adminConfig? and not dbConfig.user?
                it "returns true because the app-user doesn't count", ( done ) ->
                    inst.connect((( done, result ) ->
                        result.should.be.true
                        done()
                    ).bind(null, done))

                it "should have connected the admin connection", ->
                    inst.should.have.property("adminConnection").not.equal(null).and.type("object")

                it "should have connected the app connection", ->
                    inst.should.have.property("appConnection").not.equal(null).and.type("object")

            else if not adminConfig? and not dbConfig.user?
                it "returns true because the app-user doesn't count", ( done ) ->
                    inst.connect((( done, result ) ->
                        result.should.be.true
                        done()
                    ).bind(null, done))

                it "shouldn't have connected an admin connection", ->
                    inst.should.have.property("adminConnection", null)

                it "should have connected the app connection", ->
                    inst.should.have.property("appConnection").not.equal(null).and.type("object")

            else if not adminConfig? and dbConfig.user?
                it "returns false because the app-user does not exist yet", ( done ) ->
                    inst.connect((( done, result ) ->
                        result.should.be.false
                        done()
                    ).bind(null, done))

                it "shouldn't have connected an admin connection", ->
                    inst.should.have.property("adminConnection", null)

                it "shouldn't have connected the app connection", ->
                    inst.should.have.property("appConnection", null)


            describe "->createDbIfNotExists()", ->

                it "does not fail", ( done ) -> 
                    inst.createDbIfNotExists((( done, result ) ->
                        (typeof(result)).should.be.exactly('undefined')
                        done()
                    ).bind(null, done))

                describe "->getVersion()", ->

                    it "returns the version -1 (empty)", ( done ) ->
                        inst.getVersion(((done, result) ->
                            result.should.be.exactly(-1)
                            done()
                        ).bind(@, done))

                    describe "->setVersion(5)", ->

                        it 'does not fail', ( done ) ->
                            inst.setVersion(((done, result) ->
                                (typeof(result)).should.be.exactly('undefined')
                                done()
                            ).bind(@, done), 5)

                        describe "->getVersion()", ->

                            it "returns the version 5, so our db exists (version shall be saved in it)", 
                                ( done ) ->
                                    inst.getVersion(((done, result) ->
                                        result.should.be.exactly(5)
                                        done()
                                    ).bind(@, done))

                            describe "->createUserIfNotExists()", ->

                                it "does not fail", ( done ) -> 
                                    inst.createUserIfNotExists((( done, result ) ->
                                        (typeof(result)).should.be.exactly('undefined')
                                        done()
                                    ).bind(null, done))

                                it "should have connected the app connection", ->
                                    inst.should.have.property("appConnection").not.equal(null).and
                                        .type("object")

                                describe "->execute(workingMigration.js)", ->

                                    it "does not fail", ( done ) -> 
                                        inst.execute((( done, result) ->
                                                (typeof(result)).should.be.exactly('undefined')
                                                done()
                                            ).bind(@, done),
                                            "#{__dirname}/#{storage}/fixtures/workingMigrations/0.js"
                                        )

                                    it "does the job", ( done ) ->
                                        inst.execute((( done, result ) ->
                                                (typeof(result)).should.be.exactly('undefined')
                                                done()
                                            ).bind(@, done),
                                            "#{__dirname}/#{storage}/fixtures/queryWorkingMigration0.js"
                                        )


                                describe "->execute(invalidMigration.js)", ->

                                    it "fails properly with an error", ( done ) ->
                                        inst.execute((( done, result) ->
                                                result.should.be.instanceof(Error)
                                                done()
                                            ).bind(@, done),
                                            "#{__dirname}/#{storage}/fixtures/defectMigrations/1.js"
                                        )

                                describe "->restoreDump(someBigDump)", ->

                                    it "does not fail", ( done ) ->
                                        inst.restoreDump((( done, result) ->
                                                (typeof(result)).should.be.exactly('undefined')
                                                done()
                                            ).bind(@, done),
                                            "#{__dirname}/#{storage}/fixtures/dump"
                                        )

                                    describe "->dump()", ->

                                        dumpmeta = { dir: null }

                                        it "does not fail", ( done ) ->
                                            inst.dump((( done, dumpdir) ->
                                                    dumpdir.should.be.type("string").and.startWith("simple" +
                                                        "MigrationMongoDump.simpleMigration_testbench.20")
                                                    dumpmeta.dir = dumpdir
                                                    done()
                                                ).bind(@, done)
                                            )

                                        it "is equivalent to someBigDump", ( done ) ->
                                            cmd = "diff -r -x system.indexes.bson -x *.metadata.json #{dumpmeta.dir} " +
                                                "#{__dirname}/#{storage}/fixtures/dump"
                                            require('child_process').exec(cmd,((done, err, stdout, stderr) ->
                                                if err?
                                                    console.log(stdout, stderr)
                                                (err is null).should.be.true
                                                require("wrench").rmdirSyncRecursive(dumpmeta.dir)
                                                done()
                                            ).bind(@, done))



                                describe "->purgeUserIfExists()", ->
                                    it "does not fail", ( done ) -> 
                                        inst.purgeUserIfExists((( done, result ) ->
                                            (typeof(result)).should.be.exactly('undefined')
                                            done()
                                        ).bind(null, done))

                                    if dbConfig.user?
                                        it "should have not connected the app connection any longer", ->
                                            inst.should.have.property("appConnection", null)

                                    describe "->purgeDbIfExists()", ->

                                        it "does not fail", ( done ) -> 
                                            inst.purgeDbIfExists((( done, result ) ->
                                                (typeof(result)).should.be.exactly('undefined')
                                                done()
                                            ).bind(null, done))

                                        describe "->getVersion()", ->
                                            it "produces an error now (db does not exist)", ( done ) ->
                                                inst.getVersion(((done, result) ->
                                                    result.should.be.instanceof(Error)
                                                    done()
                                                ).bind(@, done))
