/*jshint esversion: 6 */

var peeqDashboard = require("./peeq-dashboard");

var targetDateStr = "4-29-2017";

/*
peeqDashboard.listSensorRecordsAtDate(targetDateStr)
    .catch((err) => {
        console.log(err);
    });
*/

/*
peeqDashboard.generateAllHighlightsAtDate(targetDateStr)
    .then((results) => {
        console.log(results);
    }).catch((err) => {
        console.log(err);
    });
*/

// print process.argv
process.argv.forEach(function(val, index, array) {
    console.log(index + ': ' + val);
});

if (process.argv[2] == "listSensorRecordsSnapshotsFromLocalSession") {
    var localSessionId = process.argv[3];
    peeqDashboard.listSensorRecordsSnapshotsFromLocalSession(localSessionId).catch((err) => {
        console.error(err);
    });
} else if (process.argv[2] == "listPlayerHighlightsAtDate") {
    targetDateStr = (process.argv[3]) ? process.argv[3] : targetDateStr;
    peeqDashboard.listPlayerHighlightsAtDate(targetDateStr).catch((err) => {
        console.log(err);
    });
} else if (process.argv[2] == "listRawVideosAtDate") {
    targetDateStr = (process.argv[3]) ? process.argv[3] : targetDateStr;
    peeqDashboard.listRawVideosAtDate(targetDateStr)
        .catch((err) => {
            console.log(err);
        });
}

//N.B. 2017-04-29T21:38:36.668Z -Ki_sTOqb4RtLYqR50ry