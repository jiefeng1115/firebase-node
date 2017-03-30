var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://peeq-b81e7.firebaseio.com"
});

exports.admin = admin;

var database = admin.database();

//return a promise of snapshot? of the input refPath
exports.snapshotOf = function(refPath) {
  return database.ref(refPath).once("value").then(function(snapshot) {
    return new Promise((resolve, reject) => {
      snapshot.exists() ? resolve(snapshot) : resolve(null);
    });
  });
};

//return a promise of firstChild snapshot? of the input snapshot
exports.firstChildOf = function(snapshot) {
  return new Promise((resolve, reject) => {
    if (snapshot.hasChildren()) {
      var childKey;
      snapshot.forEach(function(childSnapshot) {
          childKey = childSnapshot.key;
          return true;    //to stop the enumeration after the first child
      });
      resolve(snapshot.child(childKey));
    }
    else {
      resolve(null);
    }
  });
};
