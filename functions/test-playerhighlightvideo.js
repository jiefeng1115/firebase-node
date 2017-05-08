/*jshint esversion: 6 */
var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqPlayerHighlightVideo = require("./peeq-playerhighlightvideo");

if (process.argv[2] == "createObjsInFirebaseIfNeededWithInfo") {
    var playerHighlightVideoInfo = {};
    playerHighlightVideoInfo.localSessions = ["-KituJUcW4Yd-es6vgYm", "-KitvcG9Sphr_tpIUub8", "-KituJUR6k4g1nhWUGi_", "-KitwHH9MM2rpo59hwfo"];
    playerHighlightVideoInfo.offsetStart = -3000;
    playerHighlightVideoInfo.offsetEnd = 5000;
    playerHighlightVideoInfo.playerHighlight = "charityShield2017G1H1";
    playerHighlightVideoInfo.timestamp = "2017-04-29T13:44:05.037Z";
    playerHighlightVideoInfo.user = "zHYwUQUyddOy0aplLSmQNnvtSjx1";

    peeqPlayerHighlightVideo.createObjsInFirebaseIfNeededWithInfo(playerHighlightVideoInfo).then(result => {
        console.log("result", result);
    }).catch(err => {
        console.error(err);
    });
} else if (process.argv[2] == "publishGenerateVideoMessage") {
    var playerHighlightVideoId = process.argv[3];
    console.log("playerHighlightVideoId", playerHighlightVideoId);

    var playerHighlightVideo = new peeqPlayerHighlightVideo.PlayerHighlightVideo(playerHighlightVideoId);
    playerHighlightVideo.publishGenerateVideoMessage().then(result => {
        console.log("result", result);
    }).catch(err => {
        console.error(err);
    });
} else if (process.argv[2] == "createPlayerHighlightVideoRecord") {
    var targetId = "charityShield2017G1H18";
    console.log("targetId", targetId);
    var playerHighlightVideoInfo = {};
    playerHighlightVideoInfo.localSessions = ["-KituJUR6k4g1nhWUGi_", "-KitwHH9MM2rpo59hwfo"];
    playerHighlightVideoInfo.offsetStart = -3000;
    playerHighlightVideoInfo.offsetEnd = 5000;
    playerHighlightVideoInfo.playerHighlight = targetId;
    playerHighlightVideoInfo.timestamp = "2017-04-29T13:51:25.009Z";
    playerHighlightVideoInfo.user = "zHYwUQUyddOy0aplLSmQNnvtSjx1";

    var db = admin.database();
    var ref = db.ref("playerHighlightVideos");
    ref.child(targetId).update(playerHighlightVideoInfo).then(result => {
        console.log("result", result);
    }).catch(err => {
        console.error(err);
    });
}