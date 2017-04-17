/*jshint esversion: 6 */

var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");
var peeqLocalSession = require("./peeq-localsession");

exports.VideoSnapshotsAtDate = function(dateStrInput) {
    return peeqLocalSession.LocalSessionSnapshotsAtDate(dateStrInput).then((localSessionSnapshots) => {
        var outputSnapshots = [];
        localSessionSnapshots.forEach((localSessionSnapshot) => {
            var localSession = new peeqLocalSession.LocalSession(localSessionSnapshot.key);
            localSession.fetchVideoSnapshots().then((videoSnapshots) => {
                videoSnapshots.forEach((videoSnapshot) => {
                    console.log("videoSnapshot", videoSnapshot.val());
                    outputSnapshots.push(videoSnapshot);
                });
            });
        });
    });
}; //end of VideoSnapshotsAtDate

exports.SearchFromAllVideoSnapshotsAtDate = function(dateStrInput) {
    var targetStartPDate = new peeqDate.PDate(dateStrInput);
    var filterStartDateStrStartAt = targetStartPDate.dateStrWithTimeOffset(0);
    var filterStartDateStrEndAt = targetStartPDate.dateStrWithTimeOffset(peeqDate.milliSecToHour * 24);
    console.log("startAt", filterStartDateStrStartAt, "endAt", filterStartDateStrEndAt);

    var db = admin.database();
    var ref = db.ref("videos");

    return ref.once("value").then((allSnapshots) => {
        var snapshots = [];
        allSnapshots.forEach(function(childSnapshot) {
            var childVal = childSnapshot.val();
            //console.log("childSnapshot", childSnapshot.val());
            var keys = Object.keys(childVal);
            //console.log("key", keys[0]);
            if (keys.length > 0) {
                var videoVal = childVal[keys[0]];
                if ((videoVal.startDate > filterStartDateStrStartAt) && (videoVal.startDate < filterStartDateStrEndAt)) {
                    console.log(videoVal)
                    snapshots.push(childSnapshot);
                }
            }
        });
        return Promise.resolve(snapshots);
    });
}; //SearchFromAllVideoSnapshotsAtDate