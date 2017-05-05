/*jshint esversion: 6 */

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
}