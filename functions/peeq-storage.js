/*jshint esversion: 6 */

var Storage = require('@google-cloud/storage');

// Instantiate a storage client
var storage = Storage({
    projectId: 'peeq-b81e7',
    keyFilename: './serviceAccountKey.json'
});

var bucket = storage.bucket('peeq-b81e7.appspot.com');

exports.downloadUrl = function(storagePath) {
    var config = {
        action: 'read',
        expires: '1-1-2099'
    };
    var file = bucket.file(storagePath);
    return file.getSignedUrl(config);
};