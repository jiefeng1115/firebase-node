var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");
var peeqSensorRecord = require("./peeq-sensorrecord");

exports.PlayerHighlight = function PlayerHighlight (id, snapshot) {
  this.id = id;
  if (snapshot) {
    this.snapshot = snapshot;
  }

  //return a promise of the original obj, with snapshot assigned to obj.snapshot
  this.fetchSnapshot = function() {
    var obj = this;
    return peeqFirebase.snapshotOf("playerHighlights/" + obj.id).then(function(snapshot) {
      if ((snapshot) && (snapshot.exists())) {
        obj.snapshot = snapshot;
        obj.val = snapshot.val();
        return Promise.resolve(obj);
      }
      else {
        return Promise.reject("invalid snapshot" + obj.id);
      }
    });
  };

  //return a promise of the original obj, with snapshot assigned to obj.snapshot
  this.fetchSnapshotIfNeeded = function() {
    return (this.snapshot ? Promise.resolve(this) : this.fetchSnapshot());
  };


  //return a promise of the original obj, with RelatedLocalSessionSnapshots assigned to obj.relatedLocalSessionSnapshots
  this.fetchRelatedLocalSessionSnapshots = function() {
    console.log("fetchRelatedLocalSessionSnapshots PlayerHighlight", this.id);
    return this.fetchSnapshotIfNeeded().then(function(obj) {

      var val = obj.val;
//console.log("obj.val", val);

      var db = admin.database();
      var ref = db.ref("localSessions");

      var highlightedPDate = new peeqDate.PDate(val.timestamp);

      var startAtStr = val.timestamp;
      var endAtStr = highlightedPDate.dateStrWithTimeOffset(3600000*6);
      //console.log("endAtStr", endAtStr);

      return ref.orderByChild("endDate").startAt(startAtStr).endAt(endAtStr).once("value").then(function(filteredSnapshots) {

        var relatedSnapshots = [];
        filteredSnapshots.forEach(function(childSnapshot) {
//console.log("childSnapshot", childSnapshot.val());
          if ((childSnapshot.val().startDate < val.timestamp) && (peeqFirebase.isRelated(obj.snapshot, childSnapshot))) {
              relatedSnapshots.push(childSnapshot);
//console.log("relatedSnapshots", relatedSnapshots);
          }
        });
        obj.relatedLocalSessionSnapshots = relatedSnapshots;
//console.log("obj.relatedLocalSessionSnapshots", obj.relatedLocalSessionSnapshots);

        return Promise.resolve(obj);
      });
    });
  };    //End of fetchRelatedLocalSessionSnapshots


  //return a promise of the original obj, with obj.trackerStatistics[localSessionId][targetPlayerId] updated
  this.fetchTrackerStatisticOfLocalSessionInTimeWindow = function(localSessionSnapshot, startPDate, endPDate) {
    var obj = this;
    var localSessionId = localSessionSnapshot.key;
    console.log("fetchTrackerStatisticOfLocalSessionInTimeWindow localSessionId", localSessionId);

    var db = admin.database();
    var ref = db.ref("sensorRecords/" + localSessionId);

    var tracker = {};

    return ref.orderByChild("timestamp").startAt(startPDate.dateStr).endAt(endPDate.dateStr).once("value").then(function(filteredSnapshots) {
        //console.log("sensorRecords filteredSnapshots", filteredSnapshots.val());

        if (!tracker[localSessionId]) {
          tracker[localSessionId] = {};
        }

        var snapshotsArray = peeqFirebase.snapshotsToArray(filteredSnapshots);
        var targetPlayerIds = Object.keys(obj.val.players);
        console.log("filteredSnapshots", filteredSnapshots.numChildren(), "targetPlayerIds", targetPlayerIds);

        var statisticArray = [];

        targetPlayerIds.forEach(function(targetPlayerId) {
          console.log("targetPlayerId",targetPlayerId);
          var filteredArray = snapshotsArray.filter(function(element) {
            var playerId = element.val().player;
            return (playerId == targetPlayerId);
          });
          //console.log("filteredArray", filteredArray.length);
          var statistic = peeqSensorRecord.calculateStatisticFromSnapshotArray(filteredArray);
          //console.log("statistic", statistic);

          tracker[localSessionId][targetPlayerId] = statistic;

          statisticArray.push(statistic);
        });

        var overall = peeqSensorRecord.calculateOverallStatisticFromStatisticArray(statisticArray);
        tracker[localSessionId].overall = overall;

        //save statistic to firebase
        var statRef = db.ref("trackerStatistics/");
        statRef.set(tracker, function(error) {
          if (error) {
            console.error("Data could not be saved." + error);
          }
          //else {
          //  console.log("Data saved successfully.");
          //}
        });

        console.log("tracker", tracker);
        return Promise.resolve(tracker);
    });
  };        //End of fetchTrackerStatisticOfLocalSessionInTimeWindow


  //return all promise of each fetchTrackerStatisticOfLocalSessionInTimeWindow
  this.generateTrackerStatisticIfNeeded = function() {
    var obj = this;
    console.log("generateTrackerStatisticIfNeeded", obj.id);

    var highlightedPDate = new peeqDate.PDate(obj.val.timestamp);
    var startPDate = highlightedPDate.PDateWithTimeOffset(-1000*15);    //10sec
    var endPDate = highlightedPDate.PDateWithTimeOffset(1000*5);        //5sec

    console.log("time window", startPDate.dateStr, endPDate.dateStr);

    var promises = [];

    if (!obj.trackerStatistics) {
      obj.trackerStatistics = {};
    }

    obj.relatedLocalSessionSnapshots.forEach(function(localSessionSnapshot) {
      //console.log("localSessionSnapshot",localSessionSnapshot.key, localSessionSnapshot.val());
      var prom = obj.fetchTrackerStatisticOfLocalSessionInTimeWindow(localSessionSnapshot, startPDate, endPDate);
      promises.push(prom);
    });

    return Promise.all(promises);
  };


  this.generateHighlightIfNeeded = function() {
    console.log("generateHighlightIfNeeded", this.id);
    return this.fetchRelatedLocalSessionSnapshots().then(function(obj) {
      return obj.generateTrackerStatisticIfNeeded().then(function(trackers) {
          console.log("trackers", trackers);
      });
    });
  };    //end of generateHighlightIfNeeded

};    //End of exports.PlayerHighlight
