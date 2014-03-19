class SimpleMigration

    _storage: null


    ###*
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
    ###
    constructor: ( dbConfig, adminAccess = null )  ->
        @_storage = new (require("#{__dirname}/storages/#{dbConfig.type}/index"))(dbConfig, adminAccess)


    ###*
     * test if the user from the conf can connect to the db in the conf
     * @param {callback}  cb
     * @return {bool}  true if it works
    ###
    isAccessable: ( cb ) ->
        @_storage.connect( cb )


    ###*
     * create db (and user) if it doesn't exist
    ###
    createIfNotExists: ( cb ) ->
        @_storage.createDbIfNotExists(((cb) =>
            @_storage.createUserIfNotExists(cb)
        ).bind(@, cb))


    ###*
     * purge db (and user) including all the data if it exists.
    ###
    purgeIfExists: ( cb ) ->
        @_storage.purgeUserIfExists(((cb) ->
            @_storage.purgeDbIfExists(cb)
        ).bind(@, cb))


    ###*
     * test if all migrations have been applied
     * @param {dirname} migrations  a dir containing the required migrations for the data
     * @return {bool}  true if yes
    ###
    isUptodate: ( cb, migrations ) ->
        uniqueMigrations = require("fs").readdirSync(migrations)
        @_storage.getVersion(((cb, version) ->
            cb(version is (uniqueMigrations.length - 1))
        ).bind(null, cb))


    ###*
     * apply all missing migrations (if any)
     * @param {dirname} migrations  a dir containing the required migrations for the data
    ###
    apply: ( cb, migrations ) ->
        uniqueMigrations = require("fs").readdirSync(migrations).sort()
        @_storage.getVersion(((cb, migrations, version) =>
            if version instanceof Error
                cb(version)
                return

            if version >= 0
                for i in [0..version]
                    uniqueMigrations.shift()
            if uniqueMigrations.length > 0
                @_applyMigration(migrations, uniqueMigrations, version, cb)
            else
                cb()

        ).bind(@, cb, migrations))


    ###*
     * A shorthand for create, apply and isAccessable/isUptodate
     * @param {dirname} migrations  a dir containing the required migrations for the data
    ###
    ensureReadiness: ( cb, migrations ) ->
        @createIfNotExists(((cb, migrations, res) =>
            if res? and res instanceof Error
                cb(res)
                return

            @apply(((cb, migrations, res) ->
                if res? and res instanceof Error
                    cb(res)
                    return
                cb()
            ).bind(null, cb, migrations), migrations)
        ).bind(@, cb, migrations))


    ###*
     * dump the complete database
     * @param  {filename} outfile
    ###
    backup: ( cb, outfile = null ) ->
        @_storage.dump(cb, outfile)


    ###*
     * purge the complete database and restore the given dump
     * @param  {filename} infile
    ###
    restore: ( cb, infile ) ->
        @_storage.restoreDump(cb, infile)


    _applyMigration: ( dir, migrations, migrationId, cb ) ->
        @_storage.dump(((cb, dir, migrations, migrationId, dumpfile) =>
            if dumpfile instanceof Error
                cb(dumpfile)
                return
            # console.log("sucker! #{dumpfile}")
            @_storage.execute( ((cb, dir, migrations, migrationId, dumpfile, res) =>
                if res? and res instanceof Error
                    @_storage.restoreDump(((cb) ->
                        require("wrench").rmdirSyncRecursive(dumpfile)
                        cb()
                    ).bind(null, cb.bind(null, res)), dumpfile)
                    return
                migrations.shift()
                migrationId++
                @_storage.setVersion(((cb, dir, migrations, dumpfile, migrationId, res) =>
                    if res? and res instanceof Error
                        @_storage.restoreDump(((cb) ->
                            require("wrench").rmdirSyncRecursive(dumpfile)
                            cb()
                        ).bind(null, cb.bind(null, res)), dumpfile)
                        return
                    if migrations.length > 0
                        if require("fs").statSync(dumpfile).isDirectory()
                            require("wrench").rmdirSyncRecursive(dumpfile)
                        else
                            require("fs").unlinkSync(dumpfile)
                        @_applyMigration(dir, migrations, migrationId, cb)
                    else
                        cb()
                ).bind(@, cb, dir, migrations, dumpfile, migrationId), migrationId)
            ).bind(@, cb, dir, migrations, migrationId, dumpfile), "#{dir}/#{migrations[0]}")
            
        ).bind(@, cb, dir, migrations, migrationId))




module.exports = SimpleMigration