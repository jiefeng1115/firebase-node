/*jshint esversion: 6 */

var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");

const relatedLocalSessionsStartDataTimeOffsetStartAt = -peeqDate.milliSecToMinute * 30; //30 min before
const relatedLocalSessionsStartDataTimeOffsetEndAt = peeqDate.milliSecToMinute * 30; //30 min after
const isReadyForProcessingPlayerHighlightsThresholdEndDateToNow = peeqDate.milliSecToHour; //1 hr before now

exports.LocalSession = function LocalSession(id, snapshot) {
    this.id = id;
    if (snapshot) {
        this.snapshot = snapshot;
    }

    //return a promise of the original obj, with snapshot assigned to obj.snapshot
    this.fetchSnapshot = function() {
        var obj = this;
        return peeqFirebase.snapshotOf("localSessions/" + obj.id).then(function(snapshot) {
            if ((snapshot) && (snapshot.exists())) {
                obj.snapshot = snapshot;
                obj.val = snapshot.val();
                return Promise.resolve(obj);
            } else {
                return Promise.reject("invalid snapshot" + obj.id);
            }
        });
    };

    //return a promise of the original obj, with snapshot assigned to obj.snapshot
    this.fetchSnapshotIfNeeded = function() {
        return (this.snapshot ? Promise.resolve(this) : this.fetchSnapshot());
    };


    //fetch related localSessionSnapshots started within relatedLocalSessionsStartDataTimeOffsetStartAt before or after this localSession's startDate
    //return a promise of localSessionSnapshots
    this.fetchRelatedLocalSessionSnapshots = function() {
        return this.fetchSnapshotIfNeeded().then(function(obj) {
            var val = obj.val;
            var targetStartPDate = new peeqDate.PDate(val.startDate);

            var filterStartDateStrStartAt = targetStartPDate.dateStrWithTimeOffset(relatedLocalSessionsStartDataTimeOffsetStartAt);
            var filterStartDateStrEndAt = targetStartPDate.dateStrWithTimeOffset(relatedLocalSessionsStartDataTimeOffsetEndAt);

            var db = admin.database();
            var ref = db.ref("localSessions");

            return ref.orderByChild("startDate").startAt(filterStartDateStrStartAt).endAt(filterStartDateStrEndAt).once("value").then((filteredSnapshots) => {
                var relatedSnapshots = [];
                filteredSnapshots.forEach(function(childSnapshot) {
                    //console.log("childSnapshot", childSnapshot.val());
                    if ((childSnapshot.key != obj.snapshot.key) && (peeqFirebase.isRelated(obj.snapshot, childSnapshot))) {
                        relatedSnapshots.push(childSnapshot);
                        //console.log("relatedSnapshots", relatedSnapshots);
                    }
                });
                //obj.relatedLocalSessionSnapshots = relatedSnapshots;
                return Promise.resolve(relatedSnapshots);
            }); //end of orderByChild
        });
    }; //end of fetchRelatedLocalSessionSnapshots


    //return a promose of video snapshots or [] for no video
    this.fetchVideoSnapshots = function() {
        return peeqFirebase.snapshotOf("videos/" + this.id).then((snapshot) => {
            var childSnapshots = [];
            if ((snapshot) && (snapshot.exists())) {
                snapshot.forEach((childSnapshot) => {
                    childSnapshots.push(childSnapshot);
                });
            }
            return Promise.resolve(childSnapshots);
        });
    }; //end of fetchVideoSnapshots


    //return a promise of bool, stating if the associated raw video had been uploaded
    this.isRawVideoUploaded = function() {
        return this.fetchVideoSnapshots().then((snapshots) => {
            if (snapshots.length > 0) {
                var snapshot = snapshots[0];
                return (snapshot.val().storage) ? Promise.resolve(true) : Promise.resolve(false);
            }
            return Promise.resolve(false);
        });
    }; //end of isRawVideoUploaded


    //check if all related video (localSession) are uploaded, or the system had been waiting too long
    //return a promise of bool, stating if it is ready to be process for the player highlights
    this.isReadyForProcessingPlayerHighlights = function() {
        return this.fetchSnapshotIfNeeded().then(function(obj) {
            if (obj.endDate) {
                var endPDate = new peeqDate.PDate(obj.endDate);
                if (endPDate.timeIntervalToNow() > isReadyForProcessingPlayerHighlightsThresholdEndDateToNow) {
                    console.log("session was ended long ago, let's just process the highlight", obj.id);
                    return Promise.resolve(true);
                }
            }

            return obj.fetchRelatedLocalSessionSnapshots().then((relatedSnapshots) => {
                if (relatedSnapshots.length > 0) {
                    var isReadyPromises = [];
                    relatedSnapshots.forEach((snapshot) => {
                        var dummyLocalSession = new LocalSession(snapshot.key);
                        var prom = dummyLocalSession.isRawVideoUploaded();
                        isReadyPromises.push(prom);
                    });
                    return Promise.all(isReadyPromises).then((results) => {
                        var notReadyResults = results.filter(function(result) { return result === false; });
                        if (notReadyResults > 0) {
                            console.log(notReadyResults.length, "related videos were not uploaded");
                            return Promise.resolve(false);
                        } else {
                            console.log(results.length, "related videos were uploaded");
                            return Promise.resolve(true);
                        }
                    });
                } else {
                    //no related localSession
                    console.log("no related localSession was found");
                    return Promise.resolve(true);
                }
            });
        });
    }; //end of isReadyForProcessingPlayerHighlights


    //return a promise of relatedPlayerHighLightSnapshots or []
    this.fetchRelatedPlayerHighlightSnapshots = function() {
        return this.fetchSnapshotIfNeeded().then(function(obj) {
            var val = obj.val;
            var db = admin.database();
            var ref = db.ref("playerHighlights");

            return ref.orderByChild("timestamp").startAt(val.startDate).endAt(val.endDate).once("value").then(function(filteredSnapshot) {
                //console.log("filteredSnapshot.val", filteredSnapshot.val());
                var relatedSnapshots = [];
                filteredSnapshot.forEach(function(childSnapshot) {
                    if (peeqFirebase.isRelated(obj.snapshot, childSnapshot)) {
                        //console.log("isRelated", childSnapshot.val());
                        relatedSnapshots.push(childSnapshot);
                    }
                });
                return Promise.resolve(relatedSnapshots);
            }); //end of orderByChild
        });
    }; //end of fetchRelatedPlayerHighlightSnapshots

}; //End of exports.LocalSession

//return promise of localSession snapshots at a particular date
//i.e. LocalSessionAtDate("4-16-2017")
exports.LocalSessionSnapshotsAtDate = function(dateStrInput) {
    var targetStartPDate = new peeqDate.PDate(dateStrInput);
    var filterStartDateStrStartAt = targetStartPDate.dateStrWithTimeOffset(0);
    var filterStartDateStrEndAt = targetStartPDate.dateStrWithTimeOffset(peeqDate.milliSecToHour * 24);
    console.log("startAt", filterStartDateStrStartAt, "endAt", filterStartDateStrEndAt);

    var db = admin.database();
    var ref = db.ref("localSessions");

    return ref.orderByChild("startDate").startAt(filterStartDateStrStartAt).endAt(filterStartDateStrEndAt).once("value").then((filteredSnapshots) => {
        var snapshots = [];
        filteredSnapshots.forEach(function(childSnapshot) {
            console.log("childSnapshot", childSnapshot.val());
            snapshots.push(childSnapshot);
        });
        return Promise.resolve(snapshots);
    }); //end of orderByChild
}; //end of LocalSessionSnapshotsAtDate