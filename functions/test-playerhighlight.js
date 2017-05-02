/*jshint esversion: 6 */

var peeqPlayerHighlight = require("./peeq-playerhighlight");

if (process.argv[2] == "generateHighlightIfNeeded") {
    var testPlayerHighlightId = process.argv[3];
    var playerHighlight = new peeqPlayerHighlight.PlayerHighlight(testPlayerHighlightId);
    playerHighlight.generateHighlightIfNeeded().then((result) => {
        console.log("result", result);
    }).catch((err) => {
        console.error(err);
    });
}