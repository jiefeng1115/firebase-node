/*jshint esversion: 6 */

var peeqTools = require("./peeq-tools");

var testVideoUrl = "https://firebasestorage.googleapis.com/v0/b/peeq-b81e7.appspot.com/o/peeq-videos%2Fvideos%2F-KituJKQWnk92Ru0E1PU%2F-KituJM0bh-p4GhCyiE5%2Fraw_2017-04-29T13%3A32%3A04.467Z.mov?alt=media&token=2777e82e-f35d-4adf-acc5-38caa80ec784";

peeqTools.getVideoDurationFromUrl(testVideoUrl).then((duration) => {
    console.log(duration);
}).catch((err) => {
    console.error(err);
});