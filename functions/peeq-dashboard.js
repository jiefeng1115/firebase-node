/*jshint esversion: 6 */

var peeqStandardObjects = require("./standard-objects/peeq-standard-objects");

var peeqFirebase = require("./peeq-firebase");
var peeqVideo = require("./peeq-video");
var peeqSensorRecord = require("./peeq-sensorrecord");
var peeqPlayerHighlight = require("./peeq-playerhighlight");

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

            var missingEndDateSnapshotVals = snapshotVals.filter((val) => {
                return (val.endDate) ? false : true;
            });
            console.log("\nmissingEndDateSnapshotVals");
            info.missingEndDate = missingEndDateSnapshotVals.logEach().length;

            uploadedSnapshotVals = snapshotVals.filter((val) => {
                return (val.storage) ? true : false;
            });
            info.uploaded = uploadedSnapshotVals.length;

            console.log("\nuploadedSnapshotVals");
            info.missingUrl = info.uploaded - uploadedSnapshotVals.filter((val) => {
                    return (val.raw) ? true : false;
                }).map((val) => {
                    return (val.raw);
                }).logEach()
                .length;

            console.log("\nlistRawVideosAtDate:");
            for (var key in info) {
                console.log(key, ":", info[key]);
            }
            console.log("\n");

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

        console.log("\nlistSensorRecordsAtDate:");
        for (var key in info) {
            console.log(key, ":", info[key]);
        }
        console.log("\n");

        return snapshots;
    });
};

exports.listPlayerHighlightsAtDate = function(dateStr) {
    return peeqPlayerHighlight.PlayerHighlightsSnapshotsAtDate(dateStr).then((snapshots) => {
        snapshots.logEachSnapshot();

        var info = {};
        info.numOfRecords = snapshots.length;
        console.log("\nlistPlayerHighlightsAtDate");
        for (var key in info) {
            console.log(key, ":", info[key]);
        }
        console.log("\n");

        return snapshots;
    });
};