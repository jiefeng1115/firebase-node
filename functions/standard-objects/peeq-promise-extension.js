/*jshint esversion: 6 */

Promise.prototype.logResultAndCatchErr = function() {
    return this.then(result => {
        console.log("result", result);
        return result;
    }).catch(err => {
        console.error(err);
        //return Promise.reject(err);
    });
};