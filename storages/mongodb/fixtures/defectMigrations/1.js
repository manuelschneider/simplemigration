var guests = [
    {
        "id": "122131233",
        "name": "partial invalid eumele",
        "customGreeting": "Hiho Eumele!",
        "acceptedInvitation": false
    }
];

module.exports = function ( cb, db ) {

    db.collection("guests", (function ( cb, err, col ) {
        col.insert(guests, {w:1}, ((function(cb, err, docs) {
            cb("something's wrong!");
        }).bind(this, cb)));
    }).bind(this, cb));


};