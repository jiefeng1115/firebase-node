/*jshint esversion: 6 */

var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
var GeoPoint = require('geopoint');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://peeq-b81e7.firebaseio.com"
});

exports.admin = admin;

//return a promise of snapshot? of the input refPath
exports.snapshotOf = function(refPath) {
    var database = admin.database();
    return database.ref(refPath).once("value").then(function(snapshot) {
        return snapshot.exists() ? Promise.resolve(snapshot) : Promise.resolve(null);
    });
};

//return a promise of firstChild snapshot? of the input snapshot
exports.firstChildOf = function(snapshot) {
    return new Promise((resolve, reject) => {
        if (snapshot.hasChildren()) {
            var childKey;
            snapshot.forEach(function(childSnapshot) {
                childKey = childSnapshot.key;
                return true; //to stop the enumeration after the first child
            });
            resolve(snapshot.child(childKey));
        } else {
            resolve(null);
        }
    });
};

//return bool
exports.isNearByGeoPoint = function(loc1, loc2) {
    geoPoint1 = new GeoPoint(loc1.latitude, loc1.longitude);
    geoPoint2 = new GeoPoint(loc2.latitude, loc2.longitude);
    var distance = geoPoint1.distanceTo(geoPoint2); //miles
    return (distance <= 1.0);
};

//return bool, for localSession vs localSession, and localSession vs playerHighlight
exports.isRelated = function(snapshot1, snapshot2) {
    if ((snapshot1.exists) && (snapshot2.exists)) {
        val1 = snapshot1.val();
        val2 = snapshot2.val();
        if ((val1.location) && (val2.location)) {
            return ((val1.user == val2.user) && (val1.channel == val2.channel) && (exports.isNearByGeoPoint(val1.location, val2.location)));
        } else {
            console.error("isRelated missing location", snapshot1.key, snapshot2.key);
        }
    }
    return false;
};

exports.snapshotsToArray = function(snapshots, filterFunction) {
    var output = [];
    snapshots.forEach(function(childSnapshot) {
        output.push(childSnapshot);
    });
    if (filterFunction) {
        output.filter(filterFunction);
    }
    return output;
};

/*
//flatten one level of childSnapshots into an array 
exports.flattenOne = function(snapshots) {
    var childSnapshots = [];
    this.forEach((childSnapshot) => {
        childSnapshots.push(childSnapshot);
    });
    return childSnapshots;
};
*/

//return the same array for chain operation
Array.prototype.logEachSnapshot = function() {
    this.forEach((element) => {
        console.log(element.key, " : ", element.val());
    });
    return this;
};

exports.logSnapshotIfExist = function(snapshot, header) {
    if ((snapshot) && (snapshot.exists())) {
        if (header) {
            console.log(header, snapshot.key, snapshot.val());
        } else {
            console.log(snapshot.key, snapshot.val());
        }
    }
    return snapshot;
};