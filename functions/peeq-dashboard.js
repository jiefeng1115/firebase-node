/*jshint esversion: 6 */

var peeqStandardObjects = require("./standard-objects/peeq-standard-objects");

var peeqFirebase = require("./peeq-firebase");
var peeqVideo = require("./peeq-video");
var peeqSensorRecord = require("./peeq-sensorrecord");
var peeqPlayerHighlight = require("./peeq-playerhighlight");
var peeqPlayerHighlightVideo = require("./peeq-playerhighlightvideo");
var peeqLocalSession = require("./peeq-localsession");
var peeqStorage = require("./peeq-storage");

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
            var prom = peeqPlayerHighlightVideo.fetchPlayerHighlightVideoSnapshotWithPlayerHighlightId(snapshot.key)
                .then((phVideoSnapshot) => {
                    snapshot.phVideoSnapshot = phVideoSnapshot;
                    return snapshot;
                });
            promises.push(prom);
        });

        return Promise.all(promises).then((snapshots) => {
            console.log("\ngeneratedVideos");
            var promises02 = [];
            var snapshotsWithoutVideo = snapshots.filter((snap01) => {
                var phVideoSnapshot = snap01.phVideoSnapshot;

                /*
                if (phVideoSnapshot.hasChildren()) {
                    snap01.phVideoSnapshot.forEach(snap03 => {
                        if ((snap03) && (snap03.exists())) {
                            var val03 = snap03.val();
                            var keys03 = Object.keys(val03);
                            var key03 = keys03[0];
                            if (val03[key03].storage) {
                                phVideoSnapshot = snap03;
                            }
                        }
                    });
                }
                */

                if ((phVideoSnapshot) && (phVideoSnapshot.exists())) {
                    var val = phVideoSnapshot.val();
                    var keys = Object.keys(val);
                    var key = keys[0];
                    if (val[key].storage) {
                        if (val[key].video) {
                            if (Array.isArray(val[key].video)) {
                                var url = val[key].video[0];
                                var prom = phVideoSnapshot.child(key).ref.child("video").set(url);
                                console.log(key, url, "\n");
                                promises02.push(prom);
                            } else {
                                console.log(key, val[key].video, "\n");
                            }
                        } else {
                            var prom02 = peeqStorage.downloadUrl(val[key].storage).then(urls => {
                                if (urls[0]) {
                                    var url = urls[0];
                                    console.log(snap01.key, url, "\n");
                                    return phVideoSnapshot.child(key).ref.child("video").set(url);
                                } else {
                                    return Promise.reject("invalid urls");
                                }
                            });
                            promises02.push(prom02);
                        }

                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            });

            console.log("\nsnapshotsWithoutVideo");
            snapshotsWithoutVideo.forEach((snap02) => {
                peeqFirebase.logSnapshotIfExist(snap02);
                peeqFirebase.logSnapshotIfExist(snap02.phVideoSnapshot, "  ");
                console.log("\n");
            });

            info.numOfGenerated = info.numOfRecords - snapshotsWithoutVideo.length;

            console.log("\nlistPlayerHighlightsAtDate");
            for (var key in info) {
                console.log(key, ":", info[key]);
            }
            console.log("\n");

            return Promise.all(promises02);
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

exports.listSensorRecordsSnapshotsFromLocalSession = function(localSessionId) {
    var localSession = new peeqLocalSession.LocalSession(localSessionId);
    return localSession.fetchSensorRecordSnapshots().then((snapshots) => {
        snapshots.forEach((snapshot) => {
            var val = snapshot.val();
            console.log(val.timestamp, val.player);
        });
    });
};