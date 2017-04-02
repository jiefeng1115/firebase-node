var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
//var database = admin.database();

/*
//Date
var date = new Date('2017-03-28T19:15:26.387Z');
console.log("date", date);
*/

//var testLocalSessionId = "-KgLL16nyOS2YsgHe9fV";
//var testLocalSessionId = "-KgaHHJXnPVL-_8kamLe";
var testLocalSessionId = "-Kge7YaMlW-Ksk-gLoQJ";

var peeqLocationRecord = require("./peeq-locationrecord");
/*
peeqLocationRecord.latestOf(testLocalSessionId).then(function(snapshot) {
  snapshot ? console.log("resolve", snapshot.key, snapshot.val()) : console.log("resolve", "No record");
  var geoPoint = peeqLocationRecord.toGeoPoint(snapshot);
  console.log("geoPoint", geoPoint);
}, function(err) {
  console.error("reject", err);
});
peeqLocationRecord.latestOf(testLocalSessionId+123).then(function(snapshot) {
  snapshot ? console.log("resolve", snapshot.key, snapshot.val()) : console.log("resolve", "No record");
  var geoPoint = peeqLocationRecord.toGeoPoint(snapshot);
  console.log("geoPoint", geoPoint);
}, function(err) {
  console.error("reject", err);
});
*/
/*
peeqLocationRecord.latestGeoPointOf(testLocalSessionId).then(function(geoPoint) {
  console.log("geoPoint", geoPoint);
});
*/


var peeqLocalSession = require("./peeq-localsession");
/*
peeqLocalSession.snapshotOf(testLocalSessionId).then(function(snapshot) {
  console.log("resolve", snapshot ? snapshot.val() : snapshot);
}, function(err) {
  console.error("reject", err);
});
*/

var localSession = new peeqLocalSession.LocalSession(testLocalSessionId);
//console.log(localSession);
/*
localSession.fetchSnapshotIfNeeded().then(function(snapshot) {
  console.log(snapshot.val());
});
*/
//localSession.fetchRelatedLocalSessions();

localSession.fetchRelatedPlayerHighLightSnapshots().then(function(relatedSnapshots) {
  relatedSnapshots.forEach(function(snapshot) {
    console.log(snapshot.val());
  });
}, function(err) {
  console.error(err);
});

//peeqLocalSession.test();

/*
peeqLocalSession.snapshotOf(testLocalSessionId+123).then(function(snapshot) {
  console.error("resolve", snapshot ? snapshot.val() : snapshot);
}, function(err) {
  console.error("reject", err);
});
*/



/*
var GeoPoint = require('geopoint');
var geoPoint = new GeoPoint(37.40471790548172, -121.9748698176089);
console.log("geoPoint", geoPoint);
*/

/*
var peeqGlobalSession = require("./peeq-globalsession");
peeqGlobalSession.createIfNeededWith(testLocalSessionId).then(function(obj) {
  console.log("resolve", obj);
}, function(err) {
  console.error("reject", err);
});
*/
