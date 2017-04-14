var peeqDate = require("./peeq-date");

emptyStat = function() {
    var stat = {};
    stat.count = 0;
    stat.min = -100;
    stat.max = -100;
    stat.avg = -100;
    stat.startTime = 0;
    stat.endTime = 0;
    stat.duration = 0;
    stat.numOfPlayers = 0;
    return stat;
};

exports.calcMaxAtFrom = function(snapshotArray, maxVal) {
    var maxSnapshot = snapshotArray.find(function(snapshot) {
        return snapshot.val().signalStrength == maxVal;
    });
    var pDate = new peeqDate.PDate(maxSnapshot.val().timestamp);
    return pDate.timeInterval;
};

exports.calculateStatisticFromSnapshotArray = function(snapshotArray) {
    //console.log("snapshotArray", snapshotArray);
    if (snapshotArray.length > 0) {
        var statistic = {};
        statistic.count = snapshotArray.length;

        signalStrengthArray = snapshotArray.map(function(snapshot) {
            return snapshot.val().signalStrength;
        });

        timestampArray = snapshotArray.map(function(snapshot) {
            var pDate = new peeqDate.PDate(snapshot.val().timestamp);
            return pDate.timeInterval;
        });

        //console.log("signalStrengthArray", signalStrengthArray);
        statistic.max = Math.max.apply(null, signalStrengthArray);
        statistic.min = Math.min.apply(null, signalStrengthArray);

        var sum = signalStrengthArray.reduce(function(acc, val) {
            return acc + val;
        }, 0);
        statistic.avg = sum / statistic.count;

        statistic.startTime = Math.min.apply(null, timestampArray);
        statistic.endTime = Math.max.apply(null, timestampArray);
        statistic.duration = statistic.endTime - statistic.startTime;
        statistic.numOfPlayers = 1;

        statistic.maxAt = exports.calcMaxAtFrom(snapshotArray, statistic.max);

        return statistic;
    } else {
        return emptyStat();
    }
};


exports.calculateOverallStatisticFromStatisticArray = function(statisticArray) {
    //console.log("statisticArray", statisticArray);
    if ((!statisticArray) || (statisticArray.length == 0)) {
        return emptyStat();
    } else if (statisticArray.length == 1) {
        return statisticArray[0];
    } else {
        return statisticArray.reduce(function(acc, val) {
            //console.log("acc",acc,"val",val);
            var stat = {};
            stat.count = acc.count + val.count;
            stat.min = Math.min(acc.min, val.min);
            stat.max = Math.max(acc.max, val.max);
            stat.avg = ((acc.avg * acc.count) + (val.avg * val.count)) / stat.count;
            stat.startTime = Math.min(acc.startTime, val.startTime);
            stat.endTime = Math.max(acc.endTime, val.endTime);
            stat.duration = stat.endTime - stat.startTime;
            stat.numOfPlayers = acc.numOfPlayers + val.numOfPlayers;
            if (!acc.maxAts) {
                acc.maxAts = [acc.maxAt];
            }
            stat.maxAts = acc.maxAts.push(val.maxAt);

            return stat;
        });
    }
};

//return a promise of overallStat of the localSession
exports.fetchTrackerStatisticOfLocalSessionInTimeWindow = function(localSessionSnapshot, startPDate, endPDate, players) {
    //var obj = this;
    var localSessionId = localSessionSnapshot.key;
    console.log("fetchTrackerStatisticOfLocalSessionInTimeWindow localSessionId", localSessionId);

    var db = admin.database();
    var ref = db.ref("sensorRecords/" + localSessionId);

    var trackerStat = {};

    return ref.orderByChild("timestamp").startAt(startPDate.dateStr).endAt(endPDate.dateStr).once("value").then(function(filteredSnapshots) {
        //console.log("sensorRecords filteredSnapshots", filteredSnapshots.val());

        if (!trackerStat[localSessionId]) {
            trackerStat[localSessionId] = {};
        }

        var snapshotsArray = peeqFirebase.snapshotsToArray(filteredSnapshots);
        var targetPlayerIds = Object.keys(players);
        console.log("filteredSnapshots", filteredSnapshots.numChildren(), "targetPlayerIds", targetPlayerIds);

        var statisticArray = []; //statistic array holder for generating the overall statistic

        targetPlayerIds.forEach(function(targetPlayerId) {
            console.log("targetPlayerId", targetPlayerId);
            var filteredArray = snapshotsArray.filter(function(element) {
                var playerId = element.val().player;
                return (playerId == targetPlayerId);
            });

            if (filteredArray.length > 0) {
                //console.log("filteredArray", filteredArray.length);
                var statistic = peeqSensorRecord.calculateStatisticFromSnapshotArray(filteredArray);
                //console.log("statistic", statistic);
                statisticArray.push(statistic);
                trackerStat[localSessionId][targetPlayerId] = statistic;
            }
        });

        var overallStat = peeqSensorRecord.calculateOverallStatisticFromStatisticArray(statisticArray);
        overallStat.localSession = localSessionId;
        overallStat.highlightStartTime = startPDate.timeInterval; //TODO: make the highlightStartTime and highlightEndTime dynamic
        overallStat.highlightEndTime = endPDate.timeInterval;

        //save trackerStat to firebase
        if (overallStat.count > 0) {
            var statRef = db.ref("trackerStatistics/");
            statRef.update(trackerStat, function(error) {
                if (error) {
                    console.error("Data could not be saved." + error);
                }
            });
            console.log("trackerStat", trackerStat);
        }

        return Promise.resolve(overallStat); //return overallStat as promise
    });
}; //End of fetchTrackerStatisticOfLocalSessionInTimeWindow