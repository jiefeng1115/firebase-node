/*jshint esversion: 6 */

var peeqPlayerHighlight = require("./peeq-playerhighlight");

var testPlayerHighlightId = "-KhhxIAhU3y49PpePmUb";

var playerHighlight = new peeqPlayerHighlight.PlayerHighlight(testPlayerHighlightId);

playerHighlight.generateHighlightIfNeeded().then((result) => {
    console.log("result", result);
}).catch((err) => {
    console.error(err);
});