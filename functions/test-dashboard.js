/*jshint esversion: 6 */

var peeqDashboard = require("./peeq-dashboard");

var targetDateStr = "4-29-2017";

/*
peeqDashboard.listRawVideosAtDate(targetDateStr)
    .catch((err) => {
        console.log(err);
    });
*/

/*
peeqDashboard.listSensorRecordsAtDate(targetDateStr)
    .catch((err) => {
        console.log(err);
    });
*/

peeqDashboard.listPlayerHighlightsAtDate(targetDateStr).catch((err) => {
    console.log(err);
});