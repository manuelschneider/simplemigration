SimpleMigration
=============

*yet another tool for managing databases*

* Store the number of applied migrations within the database, so it is with the database whatever happens to it..
* Migrations are hard to create, so each should be simple, as in just some SQL or Javascript doing somethin with a db, don't care for credentials, connects etc
* errors should be thrown in case something didn't work, preventing any further processing
* on failures, simply wipe the db and apply the dump from before the try -> no downscripts, as they are additional effort for writing and testing. If some admin wants to downgrade, (s)he'll have to patch the db manually, downgrading is generally no good idea.
* Manage the complete db lifecycle: Ensure it is accessable, create it, connect to it and purge it.
* Support for different storage types, from a fs-directory to mongo.
* Use only migration-counts as 'version', order is determined by sorting the filenames.
* Easy backup/restore methodology (eg for testing-fixtures)

## Example

### Migration

    var guests = [
        {
            "id": "123",
            "name": "Herbert Eumels",
            "customGreeting": "Hiho Eumele!",
            "acceptedInvitation": false
        }
    ];

    module.exports = function ( cb, db ) {

        db.createCollection("guests", (function (cb, err, col) {

            if (typeof(err) !== "undefined" && err !== null) {
                cb(err);
                return;
            }

            col.insert(guests, {w:1}, (function (cb, err, res) {
                if (typeof(err) !== "undefined" && err !== null) {
                    cb(err);
                    return;
                }

                if (res) {
                    db.ensureIndex("guests", "id", { w: 1}, (function (cb, err, res) {
                        if (typeof(err) !== "undefined" && err !== null) {
                            cb(err);
                            return;
                        }
                        if (res) {
                            cb();
                        } else {
                            cb(new Error("something went wrong"));
                        }
                    }).bind(this, cb));
                } else {
                    cb(new Error("something went wrong"));
                }

            }).bind(this, cb));

        }).bind(this, cb));

    };

### Usage (API)

    $ npm install simplemigration --save

    var SimpleMigration = require("simplemigration");
    db = new SimpleMigration({
        type: 'mongodb'
        host: 'localhost'
        port: 27017
        schema: "guestmanager"
        user: null
        pw: null
    }, {
        user: null
        pw: null
    })
    // the second param is for the administrative user and not required
    // for mongodb-instances without --auth.
    // When you use --auth, a 'superuser' is required as admin:
    //      use admin
    //      db.addUser({ user: "admin", pwd: "topsecret", roles: [
    //          "readWrite", "dbAdmin", "userAdmin", "readWriteAnyDatabase",
    //          "userAdminAnyDatabase", "dbAdminAnyDatabase", "clusterAdmin"
    //      ] })

    db.isAccessable((result) ->
        // bool, test if the app can connect to the db
    )

    db.createIfNotExists((err) ->
        // create an empty database (and user) with the given config 
    )

    db.isUptodate((result) ->
        // test if the database has all migrations applied
    ,"path/to/dbMigrations")

    db.apply((err) ->
        // apply all migrations from the given dir that have not been applied yet
    , "path/to/dbMigrations")

    db.ensureReadiness((err) ->
        // make sure the db (and the user) exists, is accessable and all migrations have been applied
    , "path/to/dbMigrations")

    db.backup((dumpfile) ->
        // backup the complete database, if no file is given, the contents are returned
    , "some/dir/contents.bak")

    db.restore((err) ->
        // give it either the result from db.backup or some file
    , "some/dir/contents.bak")

    db.purge((err) ->
        // purge the database, the user, and all data
    )


## Currently supported storage types

* MongoDB

### TODO

* Filesystem dir
* Postgres
* Sqlite
* Maria
* .. ?

## License

MPL-2.0
