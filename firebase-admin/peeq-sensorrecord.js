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

    return statistic;
  }
  else {
    return emptyStat();
  }
};


exports.calculateOverallStatisticFromStatisticArray = function(statisticArray) {
    //console.log("statisticArray", statisticArray);
    if ((!statisticArray) || (statisticArray.length == 0)) {
      return emptyStat();
    }
    else if (statisticArray.length == 1) {
      return statisticArray[0];
    }
    else {
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
        return stat;
      });
    }
};
