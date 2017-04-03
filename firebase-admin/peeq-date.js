//return new date str with time offset from the base date str
exports.dateStrWithTimeOffset = function(baseDateStr, offset) { //offset in millisec
  var newDate = new Date(baseDateStr);
  newDate.setTime(newDate.getTime() + offset);
  return newDate.toISOString();
};
