var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

var peeqDatastore = require("./peeq-datastore");
var datastore = peeqDatastore.datastore;

var peeqLocalSession = require("./peeq-localsession");

exports.createIfNeeded = function(localSessionId, callback) {
  peeqLocalSession.snapshot(localSessionId, function(snapshot) {
    if (snapshot.exists()) {
      /*
      //Check if localSessionId already exist in any globalSession
      containsInDS(localSessionId, function(err, result, entity) {
        console.log("result", result);
        if (result == true) {

        }
        else {

        }
      });
      */

      //Check if there is a GlobalSessionEntity in range for the localSession
      queryNearestGlobalSession(snapshot, function(err, entities) {
        if (!err) {
            console.log("entities", entities);
        }
        else {
            console.error(err);
        }
      });

      //otherwise createGlobalSessionInDS wiht the localSession snapshot
      //createGlobalSessionInDS(snapshot, callback);
    }
    else {
      var error = new Error("localSession not found " + localSessionId);
      console.error(error);
      callback(error);
    }
  });
};

//GlobalSessionEntity constructor from localSessionSnapshot
function GlobalSessionEntity(localSessionSnapshot) {
    var val = localSessionSnapshot.val();
    console.log("localSession", localSessionSnapshot.key, val);
    //var startDate = new Date(val.startDate);
    this.key = datastore.key(['GlobalSession']);
    this.data = {
      user: val.user,
      channel: val.channel,
      //startDate: new Date(val.startDate),                   //!!! FIXME: Date and Time object not working in query filter, map it to milliseconds with getTime() instead
      startTime: new Date(val.startDate).getTime(),
      devices: [val.device],
      localSessions: [localSessionSnapshot.key]
    };
};

createGlobalSessionInDS = function (localSessionSnapshot, callback) {
  var entity = new GlobalSessionEntity(localSessionSnapshot);
  datastore.save(entity, function(err) {
    if (!err) {
      console.log("saved", entity);
      callback(err, entity);
    }
    else {
      console.error(err);
      callback(err);
    }
  });
};

containsInDS = function(localSessionId, callback) {
  var query = datastore.createQuery('GlobalSession');
  query.filter('localSessions',[localSessionId]);   //!!! FIXME filter in should be used instead of =
  datastore.runQuery(query, function(err, entities) {
      if (!err) {
        if (entities.count > 0) {
            callback(err, true, entities[0]);
        }
        else {
            callback(err, false);
        }
      }
      else {
        console.error(err)
        callback(err, false);
      }
  });
};

queryNearestGlobalSession = function (localSessionSnapshot, callback) {
  const hourRangeFromStartDate = 2;

  var val = localSessionSnapshot.val();
  var startDate = new Date(val.startDate);
  var upperDate = new Date(val.startDate);
  upperDate.setHours(startDate.getHours() + hourRangeFromStartDate);
  var lowerDate = new Date(val.startDate);
  lowerDate.setHours(startDate.getHours() - hourRangeFromStartDate);
  //console.log("startDate range", lowerDate, upperDate);
  console.log("startDate range", lowerDate.getTime(), upperDate.getTime());

  var query = datastore.createQuery('GlobalSession');
  query.filter('user', val.user);
  query.filter('channel', val.channel);
  //query.filter('startDate','<', upperDate);
  //query.filter('startDate','>=', lowerDate);
  //query.filter('startTime','<', upperDate.getTime());
  //query.filter('startTime','>', lowerDate.getTime());
  query.filter('startTime','>',startDate.getTime());

  query.limit(1);

  datastore.runQuery(query, callback);
}

//!!! TODO: Merge duplicated GlobalSessionEntity
