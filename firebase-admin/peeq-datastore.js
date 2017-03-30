var datastore = require('@google-cloud/datastore')({
  projectId: 'peeq-b81e7',
  keyFilename: './serviceAccountKey.json'
});

exports.datastore = datastore;
