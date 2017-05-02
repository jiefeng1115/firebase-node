/*jshint esversion: 6 */

var peeqStandardObjects = require("./standard-objects/peeq-standard-objects");

var peeqFirebase = require("./peeq-firebase");
var peeqVideo = require("./peeq-video");
var peeqSensorRecord = require("./peeq-sensorrecord");
var peeqPlayerHighlight = require("./peeq-playerhighlight");
var peeqPlayerHighlightVideo = require("./peeq-playerhighlightvideo");

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

        var promises = [];
        snapshots.forEach((snapshot) => {
            var prom = peeqPlayerHighlightVideo.fetchPlayerHighlightVideoSnapshotWithPlayerHighlightId(snapshot.key);
            promises.push(prom);
        });

        return Promise.all(promises).then((phVideoSnapshots) => {

            console.log("\ngeneratedVideoSnapshots");
            var generatedVideoSnapshots = phVideoSnapshots.filter((snap01) => {
                return ((snap01 !== null) && snap01.exists());
            }).filter((snap02) => {
                var val02 = snap02.val();
                var key02s = Object.keys(val02);
                var key02 = key02s[0];
                return (val02[key02].storage) ? true : false;
            }).logEachSnapshot();

            info.numOfGenerated = generatedVideoSnapshots.length;

            console.log("\nlistPlayerHighlightsAtDate");
            for (var key in info) {
                console.log(key, ":", info[key]);
            }
            console.log("\n");

        });
    });
};

exports.generateAllHighlightsAtDate = function(dateStr) {
    return peeqPlayerHighlight.PlayerHighlightsSnapshotsAtDate(dateStr).then((snapshots) => {
        var promises = [];
        snapshots.forEach((snapshot) => {
            var testPlayerHighlightId = snapshot.key;
            var playerHighlight = new peeqPlayerHighlight.PlayerHighlight(testPlayerHighlightId);
            var prom = playerHighlight.generateHighlightIfNeeded();
            promises.push(prom);
        });
        return Promise.all(promises);
    });
};