/*jshint esversion: 6 */

//var getDuration = require('get-video-duration');
var probe = require('node-ffprobe');

exports.getVideoDurationFromUrl = function(url) {
    //return getDuration(url);

    return new Promise((resolve, reject) => {
        probe(url, function(err, probeData) {
            console.log(probeData);
            resolve(probeData);
        });
    });
};