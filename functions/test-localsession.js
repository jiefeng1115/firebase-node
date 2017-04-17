/*jshint esversion: 6 */

var peeqLocalSession = require("./peeq-localsession");

//var testLocalSessionId = "-KgpXL4n705tBzMeuKOy";
var testLocalSessionId = "-KhdK951Oc2Ra69WsXEX";

var localSession = new peeqLocalSession.LocalSession(testLocalSessionId);

/*
localSession.fetchRelatedLocalSessionSnapshots().then((result) => {
    console.log("result length", result.length);
    result.forEach((snapshot) => {
        console.log(snapshot.val());
    });
}).catch((err) => {
    console.error(err);
});
*/

/*
localSession.fetchVideoSnapshots().then((result) => {
    console.log("result length", result.length);
    result.forEach((snapshot) => {
        console.log(snapshot.val());
    });
}).catch((err) => {
    console.error(err);
});
*/

/*
localSession.isReadyForProcessingPlayerHighlights().then((result) => {
    console.log("result", result);
}).catch((err) => {
    console.error(err);
});
*/

/*
localSession.fetchRelatedPlayerHighlightSnapshots().then((result) => {
    console.log("result length", result.length);
    result.forEach((snapshot) => {
        console.log(snapshot.val());
    });
}).catch((err) => {
    console.error(err);
});
*/

peeqLocalSession.LocalSessionSnapshotsAtDate("4-16-2017");