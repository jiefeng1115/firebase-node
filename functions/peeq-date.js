/*jshint esversion: 6 */

exports.milliSecToMinute = 60000;
exports.milliSecToHour = 3600000;

exports.PDate = function PDate(dateStr) {
    this.dateStr = dateStr;
    this.date = new Date(dateStr);
    this.timeInterval = this.date.getTime();

    //return new date str with time offset (in millisec)
    this.dateStrWithTimeOffset = function(offset) { //offset in millisec
        var dummyDate = new Date(this.dateStr);
        dummyDate.setTime(dummyDate.getTime() + offset);
        return dummyDate.toISOString();
    };

    //return new PDate obj with time offset
    this.PDateWithTimeOffset = function(offset) { //offset in millisec
        return new PDate(this.dateStrWithTimeOffset(offset));
    };

    //return timeInterval in millisec
    //+ve time interval represent dateStr is larger then this.date
    //-ve time interval represent dateStr is smaller then this.date
    this.timeIntervalToDateStr = function(dateStr) {
        var dummyDate = new Date(dateStr);
        return (this.timeInterval - dummyDate.getTime());
    };
};