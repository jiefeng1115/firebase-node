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
    return new Promise((resolve, reject) => {
      snapshot.exists() ? resolve(snapshot) : resolve(null);
    });
  });
};

//return a promise of firstChild snapshot? of the input snapshot
exports.firstChildOf = function(snapshot) {
  return new Promise((resolve, reject) => {
    if (snapshot.hasChildren()) {
      var childKey;
      snapshot.forEach(function(childSnapshot) {
          childKey = childSnapshot.key;
          return true;    //to stop the enumeration after the first child
      });
      resolve(snapshot.child(childKey));
    }
    else {
      resolve(null);
    }
  });
};

//return bool
exports.isNearByGeoPoint = function(val1, val2) {
  val1.geoPoint = new GeoPoint(val1.location.latitude, val1.location.longitude);
  val2.geoPoint = new GeoPoint(val2.location.latitude, val2.location.longitude);
  var distance = val1.geoPoint.distanceTo(val2.geoPoint); //miles
  return (distance <= 1.0);
};

//return bool, for localSession vs localSession, and localSession vs playerHighlight
exports.isRelated = function(snapshot1, snapshot2) {
  if ((snapshot1.exists) && (snapshot2.exists)) {
    val1 = snapshot1.val();
    val2 = snapshot2.val();
    return ((val1.user == val2.user) && (val1.channel == val2.channel) && (exports.isNearByGeoPoint(val1,val2)));
  }
  return false;
};
