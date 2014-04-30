assert = require("should")

describe "SimpleMigration", ->

    configDescription = "default config, "

    dbConfig = JSON.parse(
        require("fs").readFileSync("#{__dirname}/storages/mongodb/fixtures/config.json",
            "utf-8"))
    if dbConfig.user?
        configDescription += "authenticated app-user, "
    else
        configDescription += "no authentication, "

    adminConfig = null
    if require("fs").existsSync("#{__dirname}/storages/mongodb/fixtures/admin.json")
        adminConfig = JSON.parse(
            require("fs").readFileSync("#{__dirname}/storages/mongodb/fixtures/admin.json",
                "utf-8"))

    if adminConfig?
        configDescription += "with admin-user"
    else
        configDescription += "no admin-user"

    inst = new (require("./SimpleMigration"))(dbConfig, adminConfig)

    it "can be instanciated (#{configDescription})", ->
        inst.should.be.type("object")

        inst.should.have.property("createIfNotExists").with.type("function")
        inst.should.have.property("purgeIfExists").with.type("function")
        inst.should.have.property("isUptodate").with.type("function")
        inst.should.have.property("apply").with.type("function")
        inst.should.have.property("ensureReadiness").with.type("function")
        inst.should.have.property("backup").with.type("function")
        inst.should.have.property("restore").with.type("function")

    describe "->isAccessable()", ->

        it "returns true", ( done ) ->
            inst.isAccessable((( done, res ) ->
                res.should.be.true
                done()
            ).bind(@, done))

    describe "->createIfNotExists()", ->

        it "doesn't fail", ( done ) ->
            inst.createIfNotExists((( done, res ) ->
                (typeof(res)).should.be.exactly('undefined')
                done()
            ).bind(@, done))

    describe "->isUptodate(workingMigrations)", ->

        it "returns false", ( done ) ->
            inst.isUptodate((( done, res ) ->
                res.should.be.false
                done()
            ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/workingMigrations/")

        describe "->apply(workingMigrations)", ->

            it "doesn't fail", ( done ) ->
                inst.apply((( done, res ) ->
                    (typeof(res)).should.be.exactly('undefined')
                    done()
                ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/workingMigrations/")

            it "makes ->isUptodate(workingMigrations) now return 'true'", ( done ) ->
                inst.isUptodate((( done, res ) ->
                    res.should.be.true
                    done()
                ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/workingMigrations/")

        describe "->ensureReadiness(workingMigrations)", ->

            it "doesn't fail", ( done ) ->
                inst.ensureReadiness((( done, res ) ->
                    (typeof(res)).should.be.exactly('undefined')
                    done()
                ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/workingMigrations/")

        describe "->ensureReadiness(invalidMigrations)", ->

            dumpmeta = { before: null, after: null }

            before ( done ) ->
                inst.backup((( done, dumpdir) ->
                    dumpmeta.before = dumpdir
                    done()
                ).bind(@, done))

            it "does fail", ( done ) ->
                inst.ensureReadiness((( done, res ) ->
                    res.should.be.instanceof(Error)
                    done()
                ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/defectMigrations/")

            it "does not alter the db (the previous state is restored)", ( done ) ->
                inst.backup((( done, dumpdir) ->
                    dumpmeta.after = dumpdir
                    cmd = "diff -r -x system.indexes.bson -x ___simpleMigrationVersion.bson -x *.metadata.json #{dumpmeta.before} #{dumpmeta.after}"
                    require('child_process').exec(cmd,((done, err, stdout, stderr) ->
                        if err isnt null
                            console.log(
                                stdout.replace(new RegExp("#{dumpmeta.before}", 'g'), "before")
                                    .replace(new RegExp("#{dumpmeta.after}", 'g'), "after"),
                                stderr.replace(new RegExp("#{dumpmeta.before}", 'g'), "before")
                                    .replace(new RegExp("#{dumpmeta.after}", 'g'), "after"),
                                )
                        require("wrench").rmdirSyncRecursive(dumpmeta.before)
                        require("wrench").rmdirSyncRecursive(dumpmeta.after)
                        (err is null).should.be.true
                        inst._storage.getVersion((( done, version ) ->
                            version.should.be.exactly(0)
                            done()
                        ).bind(null, done))
                    ).bind(@, done))
                ).bind(@, done))


    describe "->restore(someBigDump)", ->
        it "doesn't fail", ( done ) ->
            inst.restore((( done, res ) ->
                (typeof(res)).should.be.exactly('undefined')
                done()
            ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/dump")

        describe "->backup()", ->

            dumpmeta = { dir: null }

            it "does not fail", ( done ) ->
                inst.backup((( done, dumpdir) ->
                        dumpdir.should.be.type("string").and.startWith("simple" +
                            "MigrationMongoDump.simpleMigration_testbench.20")
                        dumpmeta.dir = dumpdir
                        done()
                    ).bind(@, done)
                )

            it "is equivalent to someBigDump", ( done ) ->
                cmd = "diff -r -x system.indexes.bson -x *.metadata.json #{dumpmeta.dir} " +
                    "#{__dirname}/storages/mongodb/fixtures/dump"
                require('child_process').exec(cmd,((done, err, stdout, stderr) ->
                    (err is null).should.be.true
                    require("wrench").rmdirSyncRecursive(dumpmeta.dir)
                    done()
                ).bind(@, done))

    describe "->purgeIfExists()", ->

        it "doesn't fail", ( done ) ->
            inst.purgeIfExists((( done, res ) ->
                (typeof(res)).should.be.exactly('undefined')
                done()
            ).bind(@, done))

        it "it makes isUptodate(workingMigrations) returning false (db doesn't exist any longer)", ( done ) ->
            inst.isUptodate((( done, res ) ->
                res.should.be.false
                done()
            ).bind(@, done), "#{__dirname}/storages/mongodb/fixtures/workingMigrations/")
