/*jshint esversion: 6 */

const functions = require('firebase-functions');

//const admin = require('firebase-admin');
//admin.initializeApp(functions.config().firebase);

var peeqLocalSession = require("./peeq-localsession");
var peeqPlayerHighlight = require("./peeq-playerhighlight");

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

exports.onVideoStorage = functions.database.ref('/videos/{localSessionId}/{videoId}/storage').onWrite(event => {
    console.log("onVideoStorage event", event);
    var localSessionId = event.params.localSessionId;
    var videoId = event.params.videoId;
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
}); //end of onVideoStorage