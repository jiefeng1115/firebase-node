/*jshint esversion: 6 */

var peeqTools = require("./peeq-tools");

/*
var testVideoUrl = "https://firebasestorage.googleapis.com/v0/b/peeq-b81e7.appspot.com/o/peeq-videos%2Fvideos%2F-KivX1sC-xWrXRF7gLTx%2F-KivX1sk9Fv1J5AaY1te%2Fraw_2017-04-29T21:05:15.855Z.mov?alt=media&token=cae8e19b-6c8b-45d6-9844-731f1fc54b9e";
peeqTools.getVideoDurationFromUrl(testVideoUrl).then((duration) => {
    console.log("resolved", duration);
}).catch((err) => {
    console.error(err);
});
*/

peeqTools.fixMissingEndDateVideosAtDate("4-29-2017").then((results) => {
    console.log("results", results.length, results);
}).catch((err) => {
    console.error(err);
});