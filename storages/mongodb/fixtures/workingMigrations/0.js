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