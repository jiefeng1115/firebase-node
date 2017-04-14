/*jshint esversion: 6 */

//const admin = require('firebase-admin');
//const serviceAccount = require("./serviceAccountKey.json");
var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

var peeqPubSub = require("./peeq-pubsub");

//return a promise of snapshot
exports.getTranscodeTask = function(id) {
    var db = admin.database();
    var ref = db.ref("transcodeTasks");
    var taskRef = ref.child(id);

    return taskRef.once("value");
};

//return a promise of the transcodeTaskId
exports.setTranscodeTaskState = function(id, value) {
    var db = admin.database();
    var ref = db.ref("transcodeTasks");
    var taskRef = ref.child(id);

    return taskRef.child("state").set(value).then(function() {
        var currentTime = new Date().getTime();
        return taskRef.child("updatedAt").set(currentTime).then(function() {
            console.log("setTranscodeTaskState done", id, value);
            return Promise.resolve(id);
        });
    });
};

//return a promise of the videoClipId
exports.setVideoClipStorage = function(id, value, thumbnail) {
    var db = admin.database();
    var ref = db.ref("videoClips");
    var taskRef = ref.child(id);

    return taskRef.child("storage").set(value).then(function() {
        return taskRef.child("thumbnail").set(thumbnail).then(function() {
            console.log("setVideoClipStorage done", id, value, thumbnail);
            return Promise.resolve(id);
        });
    });
};

//return a promise of the playerHighlightVideoId
exports.setPlayerHighlightVideoStorage = function(id, value) {
    var db = admin.database();
    var ref = db.ref("playerHighlightVideos");
    var taskRef = ref.child(id);

    return taskRef.child("storage").set(value).then(function() {
        var currentTime = new Date().getTime();
        return taskRef.child("updatedAt").set(currentTime).then(function() {
            console.log("setPlayerHighlightVideoStorage done", id, value);
            return Promise.resolve(id);
        });
    });
};

//return a promise of the object id
exports.setObjWith = function(refName, id, fieldName, value) {
    var db = admin.database();
    var ref = db.ref(refName);
    var idRef = ref.child(id);

    return idRef.child(fieldName).set(value).then(function() {
        var currentTime = new Date().getTime();
        return idRef.child("updatedAt").set(currentTime).then(function() {
            console.log("setWith successed", refName, id, fieldName, value);
            return Promise.resolve(id);
        });
    });
};

//return a promise of the video clip's snapshot val if it is ready
exports.isVideoClipReady = function(id) {
    var db = admin.database();
    var ref = db.ref("videoClips").child(id);

    return ref.once("value").then(function(snapshot) {
        if ((snapshot) && (snapshot.exists()) && (snapshot.val().storage)) {
            return Promise.resolve(snapshot.val());
        } else {
            return Promise.reject("videoClip not ready" + id);
        }
    });
}; //end of isVideoClipReady

//return a promise of {id: playerHighlightVideoId, storages:[storages]}
//or null if playerHighlightVideo is not yet ready (instead of reject)
exports.isPlayerHighlightVideoReadyToProceed = function(id) {
    var db = admin.database();
    var ref = db.ref("playerHighlightVideos").child(id).child("videoClips");

    return ref.once("value").then(function(snapshot) {
        if ((snapshot) && (snapshot.exists())) {
            var videoClipArray = snapshot.val();

            var promises = [];
            videoClipArray.forEach(function(videoClipId) {
                var prom = exports.isVideoClipReady(videoClipId);
                promises.push(prom);
            });
            return Promise.all(promises).then(function(videoClipVals) {
                var outputObj = {};
                outputObj.id = id;
                outputObj.storages = [];
                outputObj.thumbnails = [];
                videoClipVals.forEach(function(videoClipVal) {
                    outputObj.storages.push(videoClipVal.storage);
                    if (videoClipVal.thumbnail) {
                        outputObj.thumbnails.push(videoClipVal.thumbnail);
                    }
                });
                //setting thumbnail storages of the playerHighlightVideo that is ready
                return exports.setObjWith("playerHighlightVideos", id, "thumbnails", outputObj.thumbnails).then(function() {
                    return Promise.resolve(outputObj);
                });
            }, function(err) {
                console.log("playerHighlightVideo not ready", id, err);
                return Promise.resolve(null);
            });
        } else {
            console.log("invalid playerHighlightVideo", id);
            return Promise.resolve(null);
        }
    });
}; //end of isPlayerHighlightVideoReadyToProceed


//generate transcode task in firebase and publish message to onTranscodeTaskCreated	
//return a promise of the new transcodeTaskId
//info obj i.e. {id: playerHighlightVideoId, storages:[storages]}
exports.generateTranscodeTaskMergeWithPlayerHighlightVideoInfo = function(info) {
    console.log("createTranscodeTaskMergeWithPlayerHighlightVideoInfo", info);

    //create transcodeTask in Firebase
    var newObj = {};
    newObj.state = "init";
    newObj.updatedAt = new Date().getTime();
    newObj.type = "mergeVideoClips";
    newObj.playerHighlightVideo = info.id;
    newObj.parameters = {};
    newObj.parameters.sourceStorages = info.storages;

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
};

//return a promise of the new [transcodeTaskId]
exports.isPlayerHighlightVideosInVideoClipReadyToProceed = function(videoClipId) {
    var db = admin.database();
    var ref = db.ref("videoClips").child(videoClipId).child("playerHighlightVideos");

    return ref.once("value").then(function(snapshot) {
        if ((snapshot) && (snapshot.exists())) {
            console.log("playerHighlightVideos", snapshot.val());
            var promises = [];
            snapshot.forEach(function(playerHighlightVideoIdSnapshot) {
                var prom1 = exports.isPlayerHighlightVideoReadyToProceed(playerHighlightVideoIdSnapshot.key);
                promises.push(prom1);
            });
            return Promise.all(promises).then(function(readyOrNullObjs) {
                var outputObjs = readyOrNullObjs.filter(function(dummyObj) { return (dummyObj ? true : false); });

                var taskPromises = [];
                if ((outputObjs) && (outputObjs.length > 0)) {
                    outputObjs.forEach(function(playerHighlightVideoInfo) {
                        var prom2 = exports.generateTranscodeTaskMergeWithPlayerHighlightVideoInfo(playerHighlightVideoInfo);
                        taskPromises.push(prom2);
                    });
                }

                return (taskPromises.length > 0) ? Promise.all(taskPromises) : Promise.reject("None is ready");
            });
        } else {
            return Promise.reject("invalid videoClip " + videoClipId);
        }
    });
}; //end of isPlayerHighlightVideosInVideoClipReadyToProceed