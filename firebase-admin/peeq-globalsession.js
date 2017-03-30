var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

var peeqDatastore = require("./peeq-datastore");
var datastore = peeqDatastore.datastore;

var peeqLocalSession = require("./peeq-localsession");
var peeqLocationRecord = require("./peeq-locationrecord");

exports.createIfNeededWith = function(localSessionId) {
  //fetch the localSession
  return peeqLocalSession.snapshotOf(localSessionId).then(function(localSessionSnapshot) {
    if (localSessionSnapshot) {
      console.log("localSessionSnapshot", localSessionSnapshot.val());

      //fetch its latest GeoPoint
      return peeqLocationRecord.latestGeoPointOf(localSessionId).then(function(geoPoint) {
        console.log("geoPoint", geoPoint);
        if (geoPoint) {

          return queryNearestGlobalSession(localSessionSnapshot, geoPoint);


          //otherwise createGlobalSessionInDS with the localSession snapshot
          //return createGlobalSessionInDS(localSessionSnapshot, geoPoint);
        }
        else {
          return Promise.reject("geoPoint not found " + localSessionId);
        }
      });
    }
    else {
      return Promise.reject("localSession not found " + localSessionId);
    }


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
/*
    //Check if there is a GlobalSessionEntity in range for the localSession
    queryNearestGlobalSession(snapshot, function(err, entities) {
      if (!err) {
          console.log("entities", entities);
      }
      else {
          console.error(err);
      }
    });
*/


  });
};

//GlobalSessionEntity constructor from localSessionSnapshot
//TODO: add Ancestor paths for the Entity
function GlobalSessionEntity(localSessionSnapshot, geoPoint) {
    var val = localSessionSnapshot.val();
    //console.log("localSession", localSessionSnapshot.key, val);
    this.key = datastore.key(['GlobalSession']);
    this.data = {
      user: val.user,
      channel: val.channel,
      startDate: new Date(val.startDate),
      geoPoint: geoPoint,
      devices: [val.device],
      localSessions: [localSessionSnapshot.key]
    };
};

//return a promise of the GlobalSessionEntity
createGlobalSessionInDS = function (localSessionSnapshot, geoPoint) {
  var entity = new GlobalSessionEntity(localSessionSnapshot, geoPoint);
  return datastore.save(entity).then(function(data) {
    var apiResponse = data[0];
    console.log("createGlobalSessionInDS apiResponse", apiResponse);
    return Promise.resolve(entity);
  });
};

/*
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
*/

queryNearestGlobalSession = function (localSessionSnapshot, geoPoint) {
  const hourRangeFromStartDate = 2;

  var val = localSessionSnapshot.val();
  var startDate = new Date(val.startDate);
  var upperDate = new Date(val.startDate);
  upperDate.setHours(startDate.getHours() + hourRangeFromStartDate);
  var lowerDate = new Date(val.startDate);
  lowerDate.setHours(startDate.getHours() - hourRangeFromStartDate);
  console.log("startDate range", lowerDate, upperDate);

  var query = datastore.createQuery('GlobalSession');
  query.filter('user', val.user);
  query.filter('channel', val.channel);
  query.filter('startDate','<', upperDate);
  query.filter('startDate','>', lowerDate);
  query.limit(1);

  return query.run().then(function(data) {
    var entities = data[0];
    //console.log("entities", entities);
    return Promise.resolve(entities);
  });
};

//!!! TODO: Merge duplicated GlobalSessionEntity
