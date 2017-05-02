/*jshint esversion: 6 */

var peeqStandardObjects = require("./standard-objects/peeq-standard-objects");

var peeqVideoClip = require("./peeq-videoclip");
var peeqAppEngineFirebase = require("./peeq-appengine-firebase");

// print process.argv
process.argv.forEach(function(val, index, array) {
    console.log(index + ': ' + val);
});

if (process.argv[2] == "generateClip") {
    var idInput = process.argv[3];

    var videoClip = new peeqVideoClip.VideoClip(idInput);

    videoClip.generateClip().then(result => {
        console.log(result);
    }).catch(err => {
        console.error(err);
    });
} else if (process.argv[2] == "isPlayerHighlightVideosInVideoClipReadyToProceed") {
    var idInput = process.argv[3];
    /*
    peeqAppEngineFirebase.isPlayerHighlightVideosInVideoClipReadyToProceed(idInput).then(result => {
        console.log(result);
    }).catch(err => {
        console.error(err);
    });
    */
    peeqAppEngineFirebase.isPlayerHighlightVideosInVideoClipReadyToProceed(idInput).logResultAndCatchErr();
}