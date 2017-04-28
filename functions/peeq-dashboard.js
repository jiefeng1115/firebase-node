/*jshint esversion: 6 */

var peeqStandardObjects = require("./standard-objects/peeq-standard-objects");

var peeqVideo = require("./peeq-video");
var peeqSensorRecord = require("./peeq-sensorrecord");

//return a promise of flattened video snapshots
exports.listRawVideosAtDate = function(dateStr) {
    return peeqVideo.VideoSnapshotsAtDate(dateStr)
        .then((snapshotArrs) => {
            var snapshots = snapshotArrs.flatten();
            var snapshotVals = snapshots.map((snapshot) => {
                return snapshot.val();
            }).sortByKeyName("startDate");

            //snapshotVals.logEach();

            var info = {};
            info.numOfRecords = snapshots.length;

            info.missingEndDate = snapshotVals.filter((val) => {
                return (val.endDate) ? false : true;
            }).length;

            uploadedSnapshotVals = snapshotVals.filter((val) => {
                return (val.storage) ? true : false;
            });
            info.uploaded = uploadedSnapshotVals.length;

            info.missingUrl = info.uploaded - uploadedSnapshotVals.filter((val) => {
                    return (val.raw) ? true : false;
                }).map((val) => {
                    return (val.raw);
                }).logEach()
                .length;

            console.log("\ninfo:");
            for (var key in info) {
                console.log(key, ":", info[key]);
            }

            return snapshots;
        });
};

exports.listSensorRecordsAtDate = function(dateStr) {
    return peeqSensorRecord.SensorRecordsSnapshotsAtDate(dateStr).then((snapshotArrs) => {
        var snapshots = snapshotArrs.flatten();
        var snapshotVals = snapshots.map((snapshot) => {
            return snapshot.val();
        }).sortByKeyName("timestamp");

        var info = {};
        info.numOfLocalSession = snapshotArrs.lenth;
        info.numOfRecords = snapshots.length;

        console.log("\ninfo:");
        for (var key in info) {
            console.log(key, ":", info[key]);
        }

        return snapshots;
    });
};