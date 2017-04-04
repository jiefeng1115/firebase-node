exports.clipInfosAreEqual = function (v00,v01) {
  //console.log("v00", v00, "v01", v01);
  if (v00.count != v01.count) return false;
  for (var i = 0; i < v00.length; i++) {
    var v0 = v00[i];
    var v1 = v01[i];
    if ((v0.localSession != v1.localSession) || (v0.startTime != v1.startTime) || (v0.endTime != v1.endTime)) return false;
  }
  return true;
};
