/*jshint esversion: 6 */

const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

//N.B. if listen for the localSessions directly, multiple event will be generated per update.
// Listens for new object added to /localSessions/:localSessionId/startDate
exports.onLocalSessionStarted = functions.database.ref('/localSessions/{localSessionId}/startDate')
    .onWrite(event => {
        // Grab the current value of what was written to the Realtime Database.
        console.log('onLocalSessionStarted event', event);
        //const original = event.data.val();
        //console.log('onLocalSessionStarted', event.params.localSessionId, original);
        return null;
    });

exports.onVideoStorage = functions.database.ref('/videos/{localSessionId}/{videoId}/storage').onWrite(event => {
    console.log("onVideoStorage event", event);

    //check if all related video (localSession) are uploaded, or the system had been waiting too long

    return null;
});