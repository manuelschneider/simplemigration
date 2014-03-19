module.exports = function ( cb, db ) {

    db.collection("guests", (function (cb, err, col) {

        if (typeof(err) !== "undefined" && err !== null) {
            cb(err);
            return;
        }

        col.find().toArray((function ( cb, err, docs ) {
            if (docs.length === 1 && docs[0].id === "123" && docs[0].name === "Herbert Eumels" &&
                docs[0].customGreeting === "Hiho Eumele!" && docs[0].acceptedInvitation === false) {
                cb();
                return;
            }

            cb(JSON.stringify(docs));
        }).bind(this, cb));

    }).bind(this, cb));

};