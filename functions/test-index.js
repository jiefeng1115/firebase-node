/*jshint esversion: 6 */

var peeqLocalSession = require("./peeq-localsession");
var peeqPlayerHighlight = require("./peeq-playerhighlight");

//{ eventType: 'providers/google.firebase.database/eventTypes/ref.write', timestamp: '2017-04-13T19:09:34.319Z', auth: { admin: false, variable: { email_verified: false, provider: 'password', email: 'admin@peeqdata.com', user_id: 'W4FoiXe2KcYwu7swdxDR67NHFcj2', token: [Object], uid: 'W4FoiXe2KcYwu7swdxDR67NHFcj2' } }, data: DeltaSnapshot { app: FirebaseApp { firebaseInternals_: [Object], services_: [Object], isDeleted_: false, name_: 'ad668ab728531906d3b9adba0502c49e27d9b602', options_: [Object], database: [Function: bound ], auth: [Function: bound ], messaging: [Function: bound ], INTERNAL: [Object] }, adminApp: FirebaseApp { firebaseInternals_: [Object], services_: [Object], isDeleted_: false, name_: '__admin__', options_: [Object], database: [Function: bound ], auth: [Function: bound ], messaging: [Function: bound ], INTERNAL: [Object] }, _path: '/videos/-KhchxtOXjLJvft63vUP/-Khchy0GRSb1M9DuzEQ3/storage', _data: null, _delta: 'peeq-videos/videos/-KhchxtOXjLJvft63vUP/-Khchy0GRSb1M9DuzEQ3/raw_2017-04-13T19:08:52.743Z.mov', _newData: 'peeq-videos/videos/-KhchxtOXjLJvft63vUP/-Khchy0GRSb1M9DuzEQ3/raw_2017-04-13T19:08:52.743Z.mov' }, params: { localSessionId: '-KhchxtOXjLJvft63vUP', videoId: '-Khchy0GRSb1M9DuzEQ3' }, eventId: 'Yl06eWEMhmYBXw4QV2b5AR7TK3o=', resource: 'projects/_/instances/peeq-b81e7/refs/videos/-KhchxtOXjLJvft63vUP/-Khchy0GRSb1M9DuzEQ3/storage' }
var event = {};
event.params = {};
event.params.localSessionId = '-Khcvk7U0YbweLdqpgMC';
event.params.videoId = '-Khchy0GRSb1M9DuzEQ3';

exports.onVideoStorageWithEvent = function(event) {
    console.log("onVideoStorageWithEvent", event);
    var localSessionId = event.params.localSessionId;
    var videoId = event.params.videoId;
    var localSession = new peeqLocalSession.LocalSession(localSessionId);

    return localSession.isReadyForProcessingPlayerHighlights().then((isReady) => {
        if (isReady) {
            localSession.fetchRelatedPlayerHighlightSnapshots().then((playerHighlightSnapshots) => {
                console.log("playerHighlightSnapshots length", playerHighlightSnapshots.length);
                var generatePlayerHighlightPromises = [];
                playerHighlightSnapshots.forEach((playerHighlightSnapshot) => {
                    var dummyPlayerHighlight = new peeqPlayerHighlight.PlayerHighlight(playerHighlightSnapshot.key);
                    generatePlayerHighlightPromises.push(dummyPlayerHighlight.generateHighlightIfNeeded());
                });
                return Promise.all(generatePlayerHighlightPromises);
            }); //end of fetchRelatedPlayerHighlightSnapshots
        }
        return null;
    }); //end of isReadyForProcessingPlayerHighlights
}; //end of onVideoStorageWithEvent

exports.onVideoStorageWithEvent(event).then((result) => {
    console.log(result);
}).catch((err) => {
    console.error(err);
});