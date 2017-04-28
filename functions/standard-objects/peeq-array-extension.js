/*jshint esversion: 6 */

var flatten = function(arr) {
    //arr.reduce(callback, [initialValue])
    return arr.reduce(
        (acc, val) => acc.concat(
            Array.isArray(val) ? flatten(val) : val
        ), []
    );
};

Array.prototype.flatten = function() {
    return flatten(this);
};

Array.prototype.logEach = function() {
    this.forEach((element) => {
        console.log(element);
    });
};