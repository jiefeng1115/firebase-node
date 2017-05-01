/*jshint esversion: 6 */

var probe = require('node-ffprobe');
var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");
var peeqVideo = require("./peeq-video");

//return a promise of the video duration in sec
exports.getVideoDurationFromUrl = function(url) {
    return new Promise((resolve, reject) => {
        probe(url, function(err, probeData) {
            //console.log(probeData);
            if ((probeData.streams) && (probeData.streams.length > 0) && (probeData.streams[0].duration)) {
                var duration = probeData.streams[0].duration;
                resolve(duration);
            } else {
                reject("invalid probeData" + probeData);
            }
        });
    });
};

exports.fixMissingEndDateVideosAtDate = function(dateStr) {
    return peeqVideo.VideoSnapshotsAtDate(dateStr)
        .then((snapshotArrs) => {
            var snapshots = snapshotArrs.flatten();

            var promises = [];
            snapshots.filter((snapshot) => {
                var val0 = snapshot.val();
                return (val0.endDate) ? false : true;
            }).forEach((missingEndDateSnapshot) => {
                var val = missingEndDateSnapshot.val();
                if ((val.raw) && (val.startDate)) {
                    var prom = exports.getVideoDurationFromUrl(val.raw).then((duration) => {
                        var startPDate = new peeqDate.PDate(val.startDate);
                        var endDateStr = startPDate.dateStrWithTimeOffset(duration * 1000);
                        console.log("updating endDate", endDateStr, val);
                        return missingEndDateSnapshot.ref.child("endDate").set(endDateStr);
                    });
                    promises.push(prom);
                } else {
                    console.error("invalid val", val);
                }
            });
            return Promise.all(promises);
        });
};