/*jshint esversion: 6 */

var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

var peeqDate = require("./peeq-date");
var peeqSensorRecord = require("./peeq-sensorrecord");
var firstBy = require('thenby');
var peeqPlayerHighlightVideo = require("./peeq-playerhighlightvideo");
var peeqVideoClip = require("./peeq-videoclip");

const highlightedPDateOffsetStart = -1000 * 15; //TODO: Make this dynamic depends on the tracker data
const highlightedPDateOffsetEnd = 1000 * 5;
const generateHighlightDefaultNumOfVideos = 5; //TODO: Make this dynamic depends on the tracker data

//PlayerHighlight class
exports.PlayerHighlight = function PlayerHighlight(id, snapshot) {
    this.id = id;
    if (snapshot) {
        this.snapshot = snapshot;
    }

    //return a promise of the original obj, with snapshot assigned to obj.snapshot + obj.val
    this.fetchSnapshot = function() {
        var obj = this;
        return peeqFirebase.snapshotOf("playerHighlights/" + obj.id).then(function(snapshot) {
            if ((snapshot) && (snapshot.exists())) {
                obj.snapshot = snapshot;
                obj.val = snapshot.val();
                return Promise.resolve(obj);
            } else {
                return Promise.reject("invalid snapshot" + obj.id);
            }
        });
    };

    //return a promise of the original obj, with snapshot assigned to obj.snapshot
    this.fetchSnapshotIfNeeded = function() {
        return (this.snapshot ? Promise.resolve(this) : this.fetchSnapshot());
    };


    //return a promise of the original obj, with RelatedLocalSessionSnapshots assigned to obj.relatedLocalSessionSnapshots
    this.fetchRelatedLocalSessionSnapshots = function() {
        console.log("fetchRelatedLocalSessionSnapshots PlayerHighlight", this.id);
        return this.fetchSnapshotIfNeeded().then(function(obj) {

            var val = obj.val;
            //console.log("obj.val", val);

            var db = admin.database();
            var ref = db.ref("localSessions");

            var highlightedPDate = new peeqDate.PDate(val.timestamp);

            var startAtStr = val.timestamp;
            var endAtStr = highlightedPDate.dateStrWithTimeOffset(peeqDate.milliSecToHour * 6);
            //console.log("endAtStr", endAtStr);

            return ref.orderByChild("endDate").startAt(startAtStr).endAt(endAtStr).once("value").then(function(filteredSnapshots) {

                var relatedSnapshots = [];
                filteredSnapshots.forEach(function(childSnapshot) {
                    //console.log("childSnapshot", childSnapshot.val());
                    if ((childSnapshot.val().startDate < val.timestamp) && (peeqFirebase.isRelated(obj.snapshot, childSnapshot))) {
                        relatedSnapshots.push(childSnapshot);
                        //console.log("relatedSnapshots", relatedSnapshots);
                    }
                });
                obj.relatedLocalSessionSnapshots = relatedSnapshots;
                //console.log("obj.relatedLocalSessionSnapshots", obj.relatedLocalSessionSnapshots);

                return Promise.resolve(obj);
            });
        });
    }; //End of fetchRelatedLocalSessionSnapshots


    //return a promise of overallStat of the localSession in the specific time window
    this.fetchTrackerStatisticOfLocalSessionInTimeWindow = function(localSessionSnapshot, startPDate, endPDate) {
        var obj = this;
        var localSessionId = localSessionSnapshot.key;
        console.log("fetchTrackerStatisticOfLocalSessionInTimeWindow localSessionId", localSessionId);

        var db = admin.database();
        var ref = db.ref("sensorRecords/" + localSessionId);

        var trackerStat = {};

        return ref.orderByChild("timestamp").startAt(startPDate.dateStr).endAt(endPDate.dateStr).once("value").then(function(filteredSnapshots) {
            //console.log("sensorRecords filteredSnapshots", filteredSnapshots.val());

            if (!trackerStat[obj.id]) {
                trackerStat[obj.id] = {};
            }

            var snapshotsArray = peeqFirebase.snapshotsToArray(filteredSnapshots);
            var targetPlayerIds = Object.keys(obj.val.players);
            console.log("filteredSnapshots", filteredSnapshots.numChildren(), "targetPlayerIds", targetPlayerIds);

            var statisticArray = []; //statistic array holder for generating the overall statistic

            targetPlayerIds.forEach(function(targetPlayerId) {
                console.log("targetPlayerId", targetPlayerId);
                var filteredArray = snapshotsArray.filter(function(element) {
                    var playerId = element.val().player;
                    return (playerId == targetPlayerId);
                });

                if (filteredArray.length > 0) {
                    //console.log("filteredArray", filteredArray.length);
                    var statistic = peeqSensorRecord.calculateStatisticFromSnapshotArray(filteredArray);
                    //console.log("statistic", statistic);
                    statisticArray.push(statistic);
                    trackerStat[obj.id][targetPlayerId] = statistic;
                }
            });

            var overallStat = peeqSensorRecord.calculateOverallStatisticFromStatisticArray(statisticArray);
            overallStat.localSession = localSessionId;
            overallStat.highlightStartTime = startPDate.timeInterval; //TODO: make the highlightStartTime and highlightEndTime dynamic
            overallStat.highlightEndTime = endPDate.timeInterval;

            //save trackerStat to firebase
            if (overallStat.count > 0) {
                var statRef = db.ref("trackerStatistics/");
                statRef.update(trackerStat, function(error) {
                    if (error) {
                        console.error("Data could not be saved." + error);
                    }
                });
                console.log("trackerStat", trackerStat);
            }

            return Promise.resolve(overallStat); //return overallStat as promise
        });
    }; //End of fetchTrackerStatisticOfLocalSessionInTimeWindow


    //return all promise of each fetchTrackerStatisticOfLocalSessionInTimeWindow
    this.generateTrackerStatisticIfNeeded = function() {
        var obj = this;
        console.log("generateTrackerStatisticIfNeeded", obj.id);

        var highlightedPDate = new peeqDate.PDate(obj.val.timestamp);
        var startPDate = highlightedPDate.PDateWithTimeOffset(highlightedPDateOffsetStart); //10sec
        var endPDate = highlightedPDate.PDateWithTimeOffset(highlightedPDateOffsetEnd); //5sec

        console.log("time window", startPDate.dateStr, endPDate.dateStr);

        var promises = [];
        obj.relatedLocalSessionSnapshots.forEach(function(localSessionSnapshot) {
            //console.log("localSessionSnapshot",localSessionSnapshot.key, localSessionSnapshot.val());
            var prom = obj.fetchTrackerStatisticOfLocalSessionInTimeWindow(localSessionSnapshot, startPDate, endPDate);
            promises.push(prom);
        });
        return Promise.all(promises);
    }; //end of generateTrackerStatisticIfNeeded


    //return a promise of the playerHighlightVideo storage or [clipStorage / transcodeTaskId]
    this.generateHighlightWithStatistics = function(stats) {
        var obj = this;

        if (stats.length > 0) {
            var videoClips = stats.map(function(value) {
                var videoClip = {};
                videoClip.localSession = value.localSession;
                videoClip.startTime = value.highlightStartTime;
                videoClip.endTime = value.highlightEndTime;
                videoClip.thumbnailAt = value.maxAt;
                return videoClip;
            });
            console.log("videoClips", videoClips);

            return peeqVideoClip.createObjsInFirebaseIfNeeded(videoClips).then(function(videoClipResults) {
                var videoClipIds = videoClipResults.map(function(value) {
                    return value.id;
                });

                return peeqPlayerHighlightVideo.createObjInFirebaseIfNeeded(obj.val.user, obj.id, videoClipIds).then(function(playerHighlightVideoResult) {
                    console.log("playerHighlightVideoResult", playerHighlightVideoResult);
                    /*
                    if (!playerHighlightVideoResult.isNew) {
                        return Promise.reject("playerHighlightVideo already exist " + playerHighlightVideoResult.id);
                    } else {
                        var playerHighlightVideo = new peeqPlayerHighlightVideo.PlayerHighlightVideo(playerHighlightVideoResult.id);
                        return playerHighlightVideo.generateVideo();
                    }
                    */
                    console.log("playerHighlightVideo already exist " + playerHighlightVideoResult.id);
                    var playerHighlightVideo = new peeqPlayerHighlightVideo.PlayerHighlightVideo(playerHighlightVideoResult.id);
                    return playerHighlightVideo.generateVideo();
                });
            });
        }
        return Promise.reject("empty stats");
    }; //end of generateHighlightWithStatistics


    //return a promise of the playerHighlightVideo video storage or [clipStorage / transcodeTaskId]
    this.generateHighlightIfNeeded = function() {
        console.log("generateHighlightIfNeeded", this.id);
        return this.fetchRelatedLocalSessionSnapshots().then(function(obj) {
            return obj.generateTrackerStatisticIfNeeded().then(function(overallStats) {
                console.log("overallStats", overallStats);

                var overallStatsSorted = overallStats.filter(function(value) { return (value.count > 0); })
                    .sort(
                        firstBy(function(v1, v2) { return Math.abs(v1.min) - Math.abs(v2.min); }) //proximity
                        .thenBy(function(v1, v2) { return v2.numOfPlayers - v1.numOfPlayers; }) //num of highlighted players detected
                        .thenBy(function(v1, v2) { return v2.duration - v1.duration; }) //coverage
                    );
                console.log("overallStatsSorted", overallStatsSorted);

                var selectedStats = overallStatsSorted.slice(0, generateHighlightDefaultNumOfVideos);
                return obj.generateHighlightWithStatistics(selectedStats);
            });
        });
    }; //end of generateHighlightIfNeeded

}; //End of exports.PlayerHighlight