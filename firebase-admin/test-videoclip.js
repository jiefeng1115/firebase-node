var peeqVideoClip = require("./peeq-videoclip");

var testVideoClipId = "-Kh4X89DAfeqWCj6Wu1z";
var testPlayerHighlightVideoId = "-Kh4X8AuFGJYqwg2UF9z";

var videoClip = new peeqVideoClip.VideoClip(testVideoClipId);

videoClip.addPlayerHighlightVideo(testPlayerHighlightVideoId).then(function(result) {
    console.log("result", result);
}, function(err) {
    console.error(err);
});