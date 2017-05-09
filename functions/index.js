/*jshint esversion: 6 */

const functions = require('firebase-functions');

//const admin = require('firebase-admin');
//admin.initializeApp(functions.config().firebase);

var peeqVideo = require("./peeq-video");
var peeqLocalSession = require("./peeq-localsession");
var peeqPlayerHighlight = require("./peeq-playerhighlight");
var peeqPlayerHighlightVideo = require("./peeq-playerhighlightvideo");


/*
//N.B. if listen for the localSessions directly, multiple event will be generated per update.
// Listens for new object added to /localSessions/:localSessionId/startDate
exports.onLocalSessionStarted = functions.database.ref('/localSessions/{localSessionId}/startDate')
    .onWrite(event => {
        // Grab the current value of what was written to the Realtime Database.
        console.log('onLocalSessionStarted event', event);
        //const original = event.data.val();
        //console.log('onLocalSessionStarted', event.params.localSessionId, original);
        return null;
    }); //end of onLocalSessionStarted
*/

exports.onVideoStorage = functions.database.ref('/videos/{localSessionId}/{videoId}/storage').onWrite(event => {
    console.log("onVideoStorage event", event);
    var localSessionId = event.params.localSessionId;
    var videoId = event.params.videoId;

    var video = new peeqVideo.Video(localSession, videoId);
    video.generateEndDateFixingTaskIfNeeded().then(result => {
        var localSession = new peeqLocalSession.LocalSession(localSessionId);
        return localSession.isReadyForProcessingPlayerHighlights().then((isReady) => {
            if (isReady) {
                return localSession.fetchRelatedPlayerHighlightSnapshots().then((playerHighlightSnapshots) => {
                    console.log("playerHighlightSnapshots length", playerHighlightSnapshots.length);
                    var generatePlayerHighlightPromises = [];
                    playerHighlightSnapshots.forEach((playerHighlightSnapshot) => {
                        var dummyPlayerHighlight = new peeqPlayerHighlight.PlayerHighlight(playerHighlightSnapshot.key);
                        var prom = dummyPlayerHighlight.generateHighlightIfNeeded();
                        generatePlayerHighlightPromises.push(prom);
                    });
                    return Promise.all(generatePlayerHighlightPromises).then((results) => {
                        console.log("generatePlayerHighlightPromises", results);
                        return Promise.resolve(results);
                    });
                }); //end of fetchRelatedPlayerHighlightSnapshots
            }
            return null;
        }); //end of isReadyForProcessingPlayerHighlights
    }); //end of video.generateEndDateFixingTaskIfNeeded
}); //end of onVideoStorage


exports.onPlayerHighlightVideoPlayerHighlight = functions.database.ref('/playerHighlightVideos/{playerHighlightVideoId}/playerHighlight').onWrite(event => {
    console.log("onPlayerHighlightVideoPlayerHighlight event", event);
    var playerHighlightVideoId = event.params.playerHighlightVideoId;

    var playerHighlightVideo = new peeqPlayerHighlightVideo.PlayerHighlightVideo(playerHighlightVideoId);
    playerHighlightVideo.fetchSnapshotIfNeeded().then(snapshot => {
        if ((snapshot) && (snapshot.exists())) {
            var val = snapshot.val();
            if (!val.storage) {
                //video not generated yet, create a message to process it
                return playerHighlightVideo.publishGenerateVideoMessage();
            } else {
                console.log("video of playerHighlightVideo " + playerHighlightVideoId + " already exist, stop processing");
            }
        } else {
            return Promise.reject("Invalid playerHighlightVideo " + playerHighlightVideoId);
        }
        return null;
    }).catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
}); //end of onPlayerHighlightVideoPlayerHighlight