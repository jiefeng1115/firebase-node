/*jshint esversion: 6 */

var pubsub = require('@google-cloud/pubsub')({
    projectId: 'peeq-b81e7',
    keyFilename: './serviceAccountKey.json'
});

exports.pubsub = pubsub;

//return a promise of the messageIds
exports.publishMessage = function(topicName, data) {
    // References an existing topic, e.g. "my-topic"
    const topic = exports.pubsub.topic(topicName);

    // Publishes the message, e.g. "Hello, world!" or { amount: 599.00, status: 'pending' }
    return topic.publish(data)
        .then((results) => {
            const messageIds = results[0];
            console.log(`Message ${messageIds[0]} published.`);
            //return messageIds;
            return Promise.resolve(messageIds);
        });
};