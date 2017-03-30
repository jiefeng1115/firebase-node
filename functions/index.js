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


// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// })
