class StorageModule


    appConnection: null
    adminConnection: null


    _config: null
    _admin: null


    constructor: ( config, admin = null ) ->
        @_config = config
        @_admin = admin


    connect: ( cb ) ->
        cb(false)


    execute: ( cb, migration ) ->
        cb()


    dump: ( cb, dumpTo = null ) ->
        cb("")


    restoreDump: ( cb, dump ) ->
        cb()


    createDbIfNotExists: ( cb ) ->
        cb()


    createUserIfNotExists: ( cb ) ->
        cb()


    purgeDbIfExists: ( cb ) ->
        cb()


    purgeUserIfExists: ( cb ) ->
        cb()


    getVersion: ( cb ) ->
        cb(-1)


    setVersion: ( cb, version ) ->
        cb()



module.exports = StorageModule