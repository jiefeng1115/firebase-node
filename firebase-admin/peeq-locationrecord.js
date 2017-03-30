var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var database = admin.database();
//var GeoPoint = require('geopoint');

//return a promise of latestLocationRecord snapshot?
//TODO: adding ".indexOn": "timestamp" at /locationRecords/-KgLL16nyOS2YsgHe9fV to your security rules for better performance
exports.latestOf = function(localSessionId) {
  var ref = database.ref("locationRecords/" + localSessionId);
  return ref.orderByChild("timestamp").limitToLast(1).once("value").then(function(snapshot) {
    return peeqFirebase.firstChildOf(snapshot);
  });
};

//return a GeoPoint representation of locationRecordSnapshot
exports.toGeoPoint = function(locationRecordSnapshot) {
    if ((locationRecordSnapshot) && (locationRecordSnapshot.exists())) {
      var val = locationRecordSnapshot.val();
      return new GeoPoint(val.latitude, val.longitude);
    }
    else {
      return null;
    }
};

//return a LatLng JSON representation of locationRecordSnapshot
exports.toLatLng = function(locationRecordSnapshot) {
    if ((locationRecordSnapshot) && (locationRecordSnapshot.exists())) {
      var val = locationRecordSnapshot.val();
      return {"latitude": val.latitude,"longitude": val.longitude};
    }
    else {
      return null;
    }
};

//return a promise of GeoPoint?
exports.latestGeoPointOf = function(localSessionId) {
  return exports.latestOf(localSessionId).then(function(locationRecordSnapshot) {
    return Promise.resolve(exports.toLatLng(locationRecordSnapshot));
  });
};
