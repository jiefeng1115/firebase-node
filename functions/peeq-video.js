/*jshint esversion: 6 */

var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");
var peeqLocalSession = require("./peeq-localsession");
var peeqPubSub = require("./peeq-pubsub");

exports.VideoSnapshotsAtDate = function(dateStrInput) {
    return peeqLocalSession.LocalSessionSnapshotsAtDate(dateStrInput).then((localSessionSnapshots) => {
        var promises = [];
        localSessionSnapshots.forEach((localSessionSnapshot) => {
            var localSession = new peeqLocalSession.LocalSession(localSessionSnapshot.key);
            var prom = localSession.fetchVideoSnapshots();
            promises.push(prom);
        });
        return Promise.all(promises);
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
                    console.log(videoVal);
                    snapshots.push(childSnapshot);
                }
            }
        });
        return Promise.resolve(snapshots);
    });
}; //SearchFromAllVideoSnapshotsAtDate

//Video class ===================================
exports.Video = function Video(localSessionId, videoId, snapshot) {
    this.localSessionId = localSessionId;
    this.videoId = videoId;
    this.id = localSessionId + "/" + videoId;
    if (snapshot) {
        this.snapshot = snapshot;
    }

    //return a promise of the snapshot
    this.fetchSnapshot = function() {
        var obj = this;
        return peeqFirebase.snapshotOf("videos/" + obj.id).then(function(snapshot) {
            if ((snapshot) && (snapshot.exists())) {
                return Promise.resolve(snapshot);
            } else {
                return Promise.reject("invalid snapshot" + obj.id);
            }
        });
    };

    //return a promise of the snapshot
    this.fetchSnapshotIfNeeded = function() {
        return (this.snapshot ? Promise.resolve(this.snapshot) : this.fetchSnapshot());
    };

    //return a promise of the endDateFixing task obj
    this.generatEndDateFixingTask = function() {
        var newObj = {};
        newObj.type = "fixVideoMissingEndDate";
        newObj.localSessionId = this.localSessionId;
        newObj.videoId = this.videoId;
        return peeqPubSub.publishMessage("onTranscodeTaskCreated", newObj).then(function(value) {
            return Promise.resolve(newObj);
        });
    };

    //return a promise of the video snapshot
    this.generateEndDateFixingTaskIfNeeded = function() {
        var obj = this;
        return obj.fetchSnapshotIfNeeded().then((snapshot) => {
            obj.snapshot = snapshot;
            obj.val = snapshot.val();
            //console.log("video", obj.val);

            if (obj.val.endDate) {
                return Promise.resolve(obj); //fix not needed
            } else {
                return obj.generatEndDateFixingTask().then(result => {
                    return Promise.reject("fixing video missing endDate");
                });
            }
        });
    }; //end of generateEndDateFixingTaskIfNeeded
};