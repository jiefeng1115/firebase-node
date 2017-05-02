/*jshint esversion: 6 */

var peeqDashboard = require("./peeq-dashboard");

var targetDateStr = "4-29-2017";

peeqDashboard.generateAllHighlightsAtDate(targetDateStr)
    .then((results) => {
        console.log(results);
    }).catch((err) => {
        console.log(err);
    });
