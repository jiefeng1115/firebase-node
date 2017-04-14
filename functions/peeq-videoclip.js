var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");
var peeqPubSub = require("./peeq-pubsub");

exports.objsAreEqual = function(v1, v2) {
    return ((v1.startTime == v2.startTime) && (v1.endTime == v2.endTime) && (v1.localSession == v2.localSession));
};

//return a promise of results {id, isNew}
exports.createObjInFirebaseIfNeeded = function(videoClip) {
    var db = admin.database();
    var ref = db.ref("videoClips");
    //check if an equivlent obj already exist
    return ref.orderByChild("localSession").equalTo(videoClip.localSession).once("value").then(function(snapshots) {
        var videoClipSnapshotOutput = null;

        snapshots.forEach(function(snapshot) {
            if ((!videoClipSnapshotOutput) && (snapshot.exists())) {
                var val = snapshot.val();
                //console.log("val", val);
                if (exports.objsAreEqual(videoClip, val)) {
                    videoClipSnapshotOutput = snapshot;
                }
            }
        });

        if (videoClipSnapshotOutput) {
            var results = {};
            results.id = videoClipSnapshotOutput.key;
            results.isNew = false;
            return Promise.resolve(results);
        } else {
            //create a new record
            var newObjRef = ref.push();
            return newObjRef.set(videoClip).then(function() {
                var results = {};
                results.id = newObjRef.key;
                results.isNew = true;
                return Promise.resolve(results);
            });
        }
    });
};

//return Promise.all(promises)
this.createObjsInFirebaseIfNeeded = function(videoClips) {
    var promises = [];
    videoClips.forEach(function(videoClip) {
        var promise = exports.createObjInFirebaseIfNeeded(videoClip);
        promises.push(promise);
    });
    return Promise.all(promises);
};

exports.dummyVideoClip = function() {
    var videoClip = {};
    videoClip.startTime = 123;
    videoClip.endTime = 456;
    videoClip.localSession = 123456;
    return videoClip;
};

exports.testCreateObjsInFirebaseIfNeeded = function() {
    var videoClip = exports.dummyVideoClip();
    return exports.createObjsInFirebaseIfNeeded([videoClip, videoClip]);
};


//VideoClip class ===================================
exports.VideoClip = function VideoClip(id, snapshot) {
    this.id = id;
    if (snapshot) {
        this.snapshot = snapshot;
    }

    //return a promise of the snapshot
    this.fetchSnapshot = function() {
        var obj = this;
        return peeqFirebase.snapshotOf("videoClips/" + obj.id).then(function(snapshot) {
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


    //return a promise of the new transcodeTaskId
    this.generateTranscodeTask = function() {
        var obj = this;
        var db = admin.database();
        var ref = db.ref("videos/" + obj.val.localSession);

        //TODO: Adapt for multiple videos in a localSession if needed
        //For now, there should be only one video record in ref
        return ref.once("value").then(function(snapshot) {
            //video record snapshot
            if ((snapshot) && (snapshot.exists()) && (snapshot.numChildren() > 0)) {
                //var child = snapshot.child();
                var parentVal = snapshot.val();
                var videoId = Object.keys(parentVal)[0];
                var val = parentVal[videoId];

                var videoStartDate = new peeqDate.PDate(val.startDate);
                var videoEndDate = new peeqDate.PDate(val.endDate);
                var videoStartTime = videoStartDate.timeInterval;
                var videoEndTime = videoEndDate.timeInterval;
                console.log("val", val, "videoStartTime", videoStartTime, "videoEndTime", videoEndTime);

                //TODO: handle case where video end time was not saved properly

                if (obj.val.startTime > videoEndTime) {
                    return Promise.reject("video time window out of range: obj.val.startTime " + obj.val.startTime + " videoEndTime " + videoEndTime);
                }
                if (obj.val.endTime < videoStartTime) {
                    return Promise.reject("video time window out of range: obj.val.endTime " + obj.val.endTime + " videoStartTime " + videoStartTime);
                }

                var adjustedStartTime = (obj.val.startTime > videoStartTime) ? obj.val.startTime : videoStartTime;
                var adjustedEndTime = (obj.val.endTime < videoEndTime) ? obj.val.endTime : videoEndTime;

                var highlightStartInVideoOffset = (adjustedStartTime - videoStartTime) / 1000; //in sec
                var highlightDurationInVideo = (adjustedEndTime - adjustedStartTime) / 1000; //in sec
                var thumbnailAtInVideoOffset = (val.thumbnailAt - videoStartTime) / 1000; // in sec

                console.log("highlightStartInVideoOffset", highlightStartInVideoOffset, "highlightDurationInVideo", highlightDurationInVideo, "thumbnailAtInVideoOffset", thumbnailAtInVideoOffset);

                //create transcodeTask in Firebase
                var newObj = {};
                newObj.state = "init";
                newObj.updatedAt = new Date().getTime();
                newObj.type = "cutVideoClip";
                newObj.parameters = {};
                newObj.parameters.highlightStartInVideoOffset = highlightStartInVideoOffset;
                newObj.parameters.highlightDurationInVideo = highlightDurationInVideo;
                newObj.parameters.sourceFile = val.storage; //i.e. "peeq-videos/videos/-Kh8zowt8ZvWhrRTGu96/-Kh8zrdjXQL-nXFGfFSK/raw_2017-04-07T19:58:51.549Z.mov"
                newObj.parameters.thumbnailAtInVideoOffset = thumbnailAtInVideoOffset;

                newObj.videoClip = obj.id;

                var db = admin.database();
                var ref = db.ref("transcodeTasks");
                var newObjRef = ref.push();
                return newObjRef.set(newObj).then(function() {
                    newObj.transcodeTask = newObjRef.key;
                    //publish task to pubsub
                    return peeqPubSub.publishMessage("onTranscodeTaskCreated", newObj).then(function(value) {
                        return Promise.resolve(newObjRef.key);
                    });
                });
            } else {
                return Promise.reject("video not found with localSession id" + obj.val.localSession);
            }
        });


    }; //end of generateTranscodeTask


    //return a promise of the clip storage or transcodeTaskId
    this.generateClip = function() {
        var obj = this;
        return obj.fetchSnapshotIfNeeded().then(function(snapshot) {
            obj.snapshot = snapshot;
            obj.val = snapshot.val();
            console.log("videoClip", obj.val);

            if (obj.val.storage) {
                return Promise.resolve(obj.val.storage); //clip already exist
            } else {
                return obj.generateTranscodeTask().then(function(transcodeTaskId) {
                    console.log("transcodeTaskId", transcodeTaskId);
                    return Promise.resolve(transcodeTaskId);
                });
            }
        });
    }; //end of generateClip

    //return a promise of the playerHighlightVideoId
    this.addPlayerHighlightVideo = function(playerHighlightVideoId) {
        //var obj = this;
        var db = admin.database();
        var ref = db.ref("videoClips").child(this.id).child("playerHighlightVideos").child(playerHighlightVideoId);
        return ref.set(true).then(function() {
            return Promise.resolve(playerHighlightVideoId);
        });
    }; //end of addPlayerHighlightVideo

}; //end of VideoClip class