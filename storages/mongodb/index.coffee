StorageModule = require("../StorageModule")

###
    NOTES:
        When you use --auth, a 'superuser' is required as admin:
            db.addUser({ user: "admin", pwd: "topsecret", roles: [
                "readWrite", "dbAdmin", "userAdmin", "readWriteAnyDatabase",
                "userAdminAnyDatabase", "dbAdminAnyDatabase", "clusterAdmin"
            ] })
###

class MongodbStorage extends StorageModule

    connect: ( cb ) ->
        if @appConnection?
            @appConnection.close()
            @appConnection = null
        if @adminConnection?
            @adminConnection.close()
            @adminConnection = null

        MongoClient = require('mongodb').MongoClient
        uri = "mongodb://#{@_config.host}:#{@_config.port}/#{@_config.schema}"

        connects = { admin: null, app: null, failed: false }

        MongoClient.connect(uri, ((cb, err, db ) =>
            if err?
                cb(false) unless connects.failed
                connects.failed = true
                return
            
            @appConnection = db

            finalCheck = ((cb, err, res) =>
                if err?
                    if @appConnection?
                        @appConnection.close()
                        @appConnection = null
                    connects.app = false
                    cb(false) unless connects.failed
                    connects.failed = true
                    return

                unless connects.failed
                    @appConnection.collectionNames({namesOnly: true}, (( cb, err, list ) ->
                        if not err? and list instanceof Array
                            connects.app = true
                            if connects.admin?
                                cb(true) unless connects.failed
                            return
                        connects.app = false
                        if @appConnection?
                            @appConnection.close()
                            @appConnection = null
                        cb(false) unless connects.failed
                        connects.failed = true
                    ).bind(@, cb))
            ).bind(@, cb)

            if @_config.user?
                @appConnection.authenticate(@_config.user, @_config.pw, finalCheck)
            else
                finalCheck()
        ).bind(@, cb))

        if @_admin?
            MongoClient.connect(uri, ((cb, err, db ) =>
                if err?
                    cb(false) unless connects.failed
                    connects.failed = true
                    return
                
                @adminConnection = db

                finalCheck = ((cb, err, res) =>
                    if err?
                        console.log(err)
                        if @adminConnection?
                            @adminConnection.close()
                            @adminConnection = null
                        connects.admin = false
                        cb(false) unless connects.failed
                        connects.failed = true
                        return

                    unless connects.failed
                        @adminConnection.collectionNames({namesOnly: true}, (( cb, err, list ) ->
                            if not err? and list instanceof Array
                                connects.admin = true
                                if connects.app?
                                    cb(true) unless connects.failed
                                return
                            connects.admin = false
                            if @adminConnection?
                                @adminConnection.close()
                                @adminConnection = null
                            cb(false) unless connects.failed
                            connects.failed = true
                        ).bind(@, cb))
                ).bind(@, cb)

                @adminConnection.admin().authenticate(@_admin.user, @_admin.pw, finalCheck)
            ).bind(@, cb))
        else
            connects.admin = true


    execute: ( cb, migration ) ->
        (require(migration))(((cb, res) ->
            if res?
                if res instanceof Error
                    cb(res)
                else
                    cb(new Error(res))
            else
                cb()
        ).bind(@, cb), @appConnection)


    dump: ( cb, dumpToDir = null ) ->
        date = new Date()
        dumpToDir ?= "simpleMigrationMongoDump.#{@_config.schema}.#{date.toISOString()}"
        cmd = "mongodump --host #{@_config.host}:#{@_config.port} --out #{dumpToDir} --db #{@_config.schema}"
        if @_admin?
            cmd += " --username '#{@_admin.user}' --password '#{@_admin.pw}'"
            cmd += " --authenticationDatabase admin"
        else if @_config.user? and @appConnection?
            cmd += " --username '#{@_config.user}' --password '#{@_config.pw}'"
        else if @_config.user?
            cb(new Error("a dump does not work without working app-creds or admin-creds!"))
            return

        require('child_process').exec(cmd, ((cb, dumpToDir, err, stdout, stderr) ->
            if err?
                cb(err)
            # else if stderr? // mongorestore produces regular output on stderr
            #     cb(new Error(stderr))
            else
                cb(dumpToDir)
        ).bind(@, cb, dumpToDir))


    restoreDump: ( cb, dumpDir ) ->
        @purgeDbIfExists(((cb, dumpDir, err) =>
            if err?
                cb(err)
            else
                cmd = "mongorestore --host #{@_config.host} --port #{@_config.port} --db #{@_config.schema}"
                if @_admin?
                    cmd += " --username '#{@_admin.user}' --password '#{@_admin.pw}'"
                    cmd += " --authenticationDatabase admin"
                else if @_config.user?
                    cb(new Error("a restore does not work without admin creds!"))
                    return
                cmd += " #{dumpDir}/#{@_config.schema}"
                require('child_process').exec(cmd, ((cb, err, stdout, stderr) ->
                    if err?
                        cb(err)
                    # else if stderr? // mongorestore produces regular output on stderr
                    #     cb(new Error(stderr))
                    else
                        cb()
                ).bind(@, cb))
        ).bind(@, cb, dumpDir))


    createDbIfNotExists: ( cb ) ->
        if @_admin?
            connection = @adminConnection
        else
            connection = @appConnection
        unless connection?.collectionNames?
            cb(new Error("no connection found"))
            return
        connection.collectionNames((( cb, err, list ) =>
            unless "___simpleMigrationVersion" in list
                connection.createCollection("___simpleMigrationVersion", (( cb, err, res ) ->
                    if err?
                        cb(err)
                        return
                    unless res
                        cb(new Error("something went wrong"))
                        return
                    connection.collection("___simpleMigrationVersion", ((cb, err, collection) ->
                        if err?
                            cb(err)
                            return
                        collection.insert({"version": -1}, {w:1}, ((cb, err, res) ->
                            if err?
                                cb(err)
                                return
                            unless res
                                cb(new Error("something went wrong"))
                                return
                            cb()
                        ).bind(@, cb))
                    ).bind(@, cb))
                ).bind(@, cb))
            else
                cb()
        ).bind(@, cb))


    createUserIfNotExists: ( cb ) ->
        if @_config.user?
            @adminConnection.collection("system.users", ((cb, err, col) ->
                if err?
                    cb(err)
                    return
                col.find().toArray((( cb, err, docs ) ->
                    if err?
                        cb(err)
                        return
                    unless @_config.user in docs
                        @adminConnection.addUser(@_config.user, @_config.pw,
                            {w: 1, roles: ["readWrite"]}, (( cb, err, res ) ->
                                if err?
                                    cb(err)
                                    return
                                unless res
                                    cb(new Error("something went wrong"))
                                    return
                                @connect(((cb, res) ->
                                    if res
                                        cb()
                                        return
                                    cb(new Error("connect failed"))
                                ).bind(@, cb))
                            ).bind(@, cb))
                    else
                        cb()
                ).bind(@, cb))
            ).bind(@, cb))
        else
            cb()


    purgeDbIfExists: ( cb ) ->
        if @_admin?
            connection = @adminConnection
        else
            connection = @appConnection
        connection.dropDatabase(((cb, err, res) ->
            if err?
                cb(err)
                return
            unless res
                cb(new Error("something went wrong"))
                return
            cb()
        ).bind(@, cb))


    purgeUserIfExists: ( cb ) ->
        if @_admin?
            connection = @adminConnection
        else
            connection = @appConnection
        if @_config.user?
            connection.removeUser(@_config.user, ((cb, err, res) ->
                if err?
                    cb(err)
                    return
                unless res
                    cb(new Error("something went wrong"))
                    return
                @appConnection.close()
                @appConnection = null
                cb()
            ).bind(@, cb))
        else
            cb()


    getVersion: ( cb ) ->
        if @_admin?
            connection = @adminConnection
        else
            connection = @appConnection
        connection.collection("___simpleMigrationVersion", ((cb, err, col) ->
            if err?
                cb(err)
                return
            col.findOne(((cb, err, item) ->
                if err?
                    cb(err)
                    return
                if item?.version?
                    cb(item.version)
                    return
                cb(new Error("something went wrong"))
            ).bind(@, cb))
        ).bind(@, cb))


    setVersion: ( cb, newVersion ) ->
        if @_admin?
            connection = @adminConnection
        else
            connection = @appConnection
        connection.collection("___simpleMigrationVersion", ((cb, newVersion, err, col) ->
            if err?
                cb(err)
                return
            col.findOne((( cb, newVersion, col, err, item ) ->
                if err?
                    cb(err)
                    return
                unless item.version?
                    cb(new Error("something went wrong"))
                    return

                col.update({version: item.version}, {$set: {version: newVersion}}, {w:1}, ((cb, err, res) ->
                    if err?
                        cb(err)
                        return
                    unless res
                        cb(new Error("something went wrong"))
                        return
                    cb()
                ).bind(@, cb))
            ).bind(@, cb, newVersion, col))
        ).bind(@, cb, newVersion))


module.exports = MongodbStorage