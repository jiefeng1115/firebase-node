/*jshint esversion: 6 */

var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqVideoClip = require("./peeq-videoclip");
var peeqAppEngineFirebase = require("./peeq-appengine-firebase");

exports.objsAreEqual = function(v1, v2) {
    //console.log("objsAreEqual", v1, v2);
    if (v1.videoClips.length != v2.videoClips.length) { return false; }
    for (var i = 0; i < v1.videoClips.length; i++) {
        if (v1.videoClips[i] != v2.videoClips[i]) { return false; }
    }
    return true;
};

//return a promise of results {id, isNew}
exports.createObjInFirebaseIfNeeded = function(userId, playerHighlightId, videoClipIds) {
    //console.log("playerHighlightVideo", "createObjInFirebaseIfNeeded", userId, playerHighlightId, videoClipIds);
    var db = admin.database();
    var ref = db.ref("playerHighlightVideos");

    var newObj = {};
    newObj.user = userId;
    newObj.playerHighlight = playerHighlightId;
    newObj.updatedAt = new Date().getTime();
    newObj.videoClips = videoClipIds;

    //check if an equivlent obj already exist
    return ref.orderByChild("playerHighlight").equalTo(playerHighlightId).once("value").then(function(snapshots) {
        var snapshotOutput = null;

        snapshots.forEach(function(snapshot) {
            if ((!snapshotOutput) && (snapshot.exists())) {
                var val = snapshot.val();
                if (exports.objsAreEqual(newObj, val)) {
                    snapshotOutput = snapshot;
                }
            }
        });

        if (snapshotOutput) {
            var results = {};
            results.id = snapshotOutput.key;
            results.isNew = false;
            return Promise.resolve(results);
        } else {
            //create a new record
            var newObjRef = ref.push();
            return newObjRef.set(newObj).then(function() {
                var results = {};
                results.id = newObjRef.key;
                results.isNew = true;
                return Promise.resolve(results);
            });
        }
    });
}; //End of createObjInFirebaseIfNeeded

exports.valIsEqualToInfo = function(v1, v2) {
    return ((v1.playerHighlight == v2.playerHighlight) && (v1.localSessions == v2.localSessions) && (v1.offsetStart == v2.offsetStart) && (v1.offsetEnd == v2.offsetEnd) && (v1.timestamp == v2.timestamp));
};

exports.createObjsInFirebaseIfNeededWithInfo = function(info) {
    console.log("playerHighlightVideoInfo", info);

    var db = admin.database();
    var ref = db.ref("playerHighlightVideos");

    //check if an equivlent obj already exist
    return ref.orderByChild("playerHighlight").equalTo(info.playerHighlight).once("value").then((snapshots) => {
        console.log("snapshots", snapshots);

        var snapshotsArr = peeqFirebase.snapshotsToArray(snapshots);

        var snapshotFound = snapshotsArr.find(snapshot => {
            if ((snapshot) && (snapshot.exists())) {
                return exports.valIsEqualToInfo(snapshot.val(), info);
            } else {
                return false;
            }
        });

        if (snapshotFound) {
            var result = {};
            result.id = snapshotFound.key;
            result.isNew = false;
            return Promise.resolve(result);
        } else {
            //create a new record
            info.updatedAt = new Date().getTime();
            var newObjRef = ref.push();
            return newObjRef.set(info).then(function() {
                var result = {};
                result.id = newObjRef.key;
                result.isNew = true;
                return Promise.resolve(result);
            });
        }
    }); //end of ref.orderByChild("playerHighlight")
}; //end of createObjsInFirebaseIfNeededWithInfo


//PlayerHighlightVideo class ===================================
exports.PlayerHighlightVideo = function PlayerHighlightVideo(id, snapshot) {
    this.id = id;
    if (snapshot) {
        this.snapshot = snapshot;
    }

    //return a promise of the snapshot
    this.fetchSnapshot = function() {
        var obj = this;
        return peeqFirebase.snapshotOf("playerHighlightVideos/" + obj.id).then(function(snapshot) {
            if ((snapshot) && (snapshot.exists())) {
                //obj.snapshot = snapshot;
                //obj.val = snapshot.val();
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

    //return a promise of the video storage or [clipStorage / transcodeTaskId]
    this.generateVideo = function() {
        var obj = this;
        return obj.fetchSnapshotIfNeeded().then(function(snapshot) {
            obj.snapshot = snapshot;
            obj.val = snapshot.val();
            console.log("playerHighlightVideo", obj.val);

            if (obj.val.storage) {
                return Promise.resolve(obj.val.storage); //video already exist
            } else {
                var promises = [];
                obj.val.videoClips.forEach(function(videoClipId) {
                    var videoClipObj = new peeqVideoClip.VideoClip(videoClipId);

                    videoClipObj.addPlayerHighlightVideo(obj.id);

                    var prom = videoClipObj.generateClip();
                    promises.push(prom);
                });

                //values are the clip storage or transcodeTaskId
                return Promise.all(promises).then(function(clipStoragesOrTranscodeTaskIds) {
                    if (clipStoragesOrTranscodeTaskIds.every(function(element) { return element.startsWith('peeq-videos'); })) {
                        console.log("all video clips are ready, let's generate the merge task for playerHighlightVideo", obj.id);
                        return peeqAppEngineFirebase.isPlayerHighlightVideoReadyToProceed(obj.id).then((playerHighlightVideoInfoOrNull) => {
                            if (playerHighlightVideoInfoOrNull) {
                                return peeqAppEngineFirebase.generateTranscodeTaskMergeWithPlayerHighlightVideoInfo(playerHighlightVideoInfoOrNull).then((mergeTranscodeTaskId) => {
                                    console.log("mergeTranscodeTaskId", mergeTranscodeTaskId);
                                    return Promise.resolve(mergeTranscodeTaskId);
                                });
                            } else {
                                console.log("somehow it is not ready yet according to isPlayerHighlightVideoReadyToProceed");
                                return Promise.resolve(clipStoragesOrTranscodeTaskIds);
                            }
                        });
                    } else {
                        console.log("clipStoragesOrTranscodeTaskIds", clipStoragesOrTranscodeTaskIds);
                        return Promise.resolve(clipStoragesOrTranscodeTaskIds);
                    }
                });
            }
        });
    }; //end of generateVideo

}; //end of PlayerHighlightVideo

//return a promise of the snapshot or null
exports.fetchPlayerHighlightVideoSnapshotWithPlayerHighlightId = function(playerHighlightId) {
    var db = admin.database();
    var ref = db.ref("playerHighlightVideos");
    return ref.orderByChild("playerHighlight").equalTo(playerHighlightId).once("value");
};