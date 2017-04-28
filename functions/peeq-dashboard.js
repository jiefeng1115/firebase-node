/*jshint esversion: 6 */

var peeqArray = require("./standard-objects/peeq-array-extension");

var peeqVideo = require("./peeq-video");

//return a promise of flattened snapshots
exports.listRawVideosAtDate = function(dateStr) {
    return peeqVideo.VideoSnapshotsAtDate(dateStr)
        .then((snapshotArrs) => {
            var snapshots = snapshotArrs.flatten();
            console.log("num of snapshots", snapshots.length, "\n");

            snapshots.map((snapshot) => {
                return snapshot.val();
            }).logEach();

            return snapshots;
        });
};