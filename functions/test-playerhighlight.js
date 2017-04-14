/*jshint esversion: 6 */

var peeqPlayerHighlight = require("./peeq-playerhighlight");

var testPlayerHighlightId = "-KhdKDeaOETIuHnACcb2";

var playerHighlight = new peeqPlayerHighlight.PlayerHighlight(testPlayerHighlightId);

playerHighlight.generateHighlightIfNeeded().then((result) => {
    console.log("result", result);
}).catch((err) => {
    console.error(err);
});