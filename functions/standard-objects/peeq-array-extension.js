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

//return the same array for chain operation
Array.prototype.logEach = function() {
    this.forEach((element) => {
        console.log(element);
    });
    return this;
};

Array.prototype.sortByKeyName = function(keyName) {
    return this.sort((a, b) => {
        if ((a[keyName]) && (b[keyName])) {
            return ((a[keyName] <= b[keyName]) ? -1 : 1);
        } else {
            return 0;
        }
    });
};

Array.prototype.isEqualTo = function(arr) {
    if (this === arr) return true;
    if (this === null || arr === null) return false;
    if (this.length != arr.length) return false;
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i] !== this[i]) return false;
    }
    return true;
};