var peeqDate = require("./peeq-date");

exports.calculateStatisticFromSnapshotArray = function(snapshotArray) {
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

  return statistic;
};

exports.calculateOverallStatisticFromStatisticArray = function(statisticArray) {
    if (statisticArray.length == 1) {
      return statisticArray[0];
    }
    else {
      var overall = statisticArray.reduce(function(acc, val) {
        var stat = {};
        stat.count = acc.count + val.count;
        stat.min = Math.min(acc.min, val.min);
        stat.max = Math.max(acc.max, val.max);
        stat.avg = ((acc.avg * avg.count) + (val.avg * val.count)) / stat.count;
        stat.startTime = Math.min(acc.startTime, val.startTime);
        stat.endTime = Math.max(acc.endTime, val.endTime);
        stat.duration = stat.endTime - stat.startTime;
        return stat;
      }, 0);
    }
};
