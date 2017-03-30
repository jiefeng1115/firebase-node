var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://peeq-b81e7.firebaseio.com"
});

exports.admin = admin;

var database = admin.database();

exports.snapshot = function(refPath, callback) {
  var ref = database.ref(refPath);
  ref.once("value", function(snapshot) {
    callback(snapshot);
  });
};
