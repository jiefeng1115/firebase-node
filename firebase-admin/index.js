var globalSession = require("./peeq-globalsession");

var testLocalSessionId = "-KgLL16nyOS2YsgHe9fV";
globalSession.createIfNeeded(testLocalSessionId, function(err, entity) {
  //console.log(err, entity);
});
