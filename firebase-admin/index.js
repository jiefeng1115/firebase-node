/*jshint esversion: 6 */

var peeqPubSub = require("./peeq-pubsub");

exports.onFileChangeInBucket = function onFileChangeInBucket(event, callback) {
    const file = event.data;
    const isDelete = file.resourceState === 'not_exists';
    const topic = "onFileChangeInBucket";

    var outputStr;
    if (isDelete) {
        console.log(`File ${file.name} deleted.`);
        outputStr = `File ${file.name} deleted.`;
    } else {
        console.log(`File ${file.name} uploaded.`);
        outputStr = `File ${file.name} uploaded.`;
    }

    peeqPubSub.publishMessage(topic, outputStr);

    callback();
};