var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqVideoClip = require("./peeq-videoclip");

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

exports.testCreateObjInFirebaseIfNeeded = function() {
    return exports.createObjInFirebaseIfNeeded("ABC", "DEF", ["1234"]);
};



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

    //return a promise of the video url
    this.generateVideo = function() {
        var obj = this;
        return obj.fetchSnapshotIfNeeded().then(function(snapshot) {
            obj.snapshot = snapshot;
            obj.val = snapshot.val();
            console.log("playerHighlightVideo", obj.val);

            if (obj.val.url) {
                return Promise.resolve(obj.val.url); //video already exist
            } else {
                var promises = [];
                obj.val.videoClips.forEach(function(videoClipId) {
                    var videoClipObj = new peeqVideoClip.VideoClip(videoClipId);

                    videoClip.addPlayerHighlightVideo(obj.id);

                    var prom = videoClipObj.generateClip();
                    promises.push(prom);
                });

                return Promise.all(promises).then(function(value) {
                    //TODO: combine the clips to form the highlight video

                    console.log("value", value);
                    return Promise.resolve("TODO");
                });
            }
        });
    }; //end of generateVideo

};