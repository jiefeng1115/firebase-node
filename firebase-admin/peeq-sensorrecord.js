exports.calculateStatisticFromSnapshotArray = function(snapshotArray) {
  var statistic = {};
  statistic.count = snapshotArray.length;

  signalStrengthArray = snapshotArray.map(function(snapshot) {
      return snapshot.val().signalStrength;
  });

  //console.log("signalStrengthArray", signalStrengthArray);
  statistic.max = Math.max.apply(null, signalStrengthArray);
  statistic.min = Math.min.apply(null, signalStrengthArray);

  var sum = signalStrengthArray.reduce(function(acc, val) {
    return acc + val;
  }, 0);
  statistic.avg = sum / statistic.count;

  return statistic;
};
