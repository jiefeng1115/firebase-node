var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

//return a promise of snapshot? of the localSessions/id
exports.snapshotOf = function(id) {
  return peeqFirebase.snapshotOf("localSessions/" + id);
};
