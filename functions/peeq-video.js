/*jshint esversion: 6 */

var peeqLocalSession = require("./peeq-localsession");

exports.VideoSnapshotsAtDate = function(dateStrInput) {
    return peeqLocalSession.LocalSessionSnapshotsAtDate(dateStrInput).then((localSessionSnapshots) => {
        var outputSnapshots = [];
        localSessionSnapshots.forEach((localSessionSnapshot) => {
            var localSession = new peeqLocalSession.LocalSession(localSessionSnapshot.key);
            localSession.fetchVideoSnapshots().then((videoSnapshots) => {
                videoSnapshots.forEach((videoSnapshot) => {
                    console.log("videoSnapshot", videoSnapshot.val());
                    outputSnapshots.push(videoSnapshot);
                });
            });
        });
    });
}; //end of VideoSnapshotsAtDate