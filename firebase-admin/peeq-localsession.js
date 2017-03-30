var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

exports.snapshot = function(id, callback) {
  peeqFirebase.snapshot("localSessions/" + id, callback);
};
