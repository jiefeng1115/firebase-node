var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");
var peeqSensorRecord = require("./peeq-sensorrecord");
var firstBy = require('thenby');
var peeqPlayerHighlightVideo = require("./peeq-playerhighlightvideo");

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
            var endAtStr = highlightedPDate.dateStrWithTimeOffset(3600000 * 6);
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


    //return a promise of overallStat of the localSession
    this.fetchTrackerStatisticOfLocalSessionInTimeWindow = function(localSessionSnapshot, startPDate, endPDate) {
        var obj = this;
        var localSessionId = localSessionSnapshot.key;
        console.log("fetchTrackerStatisticOfLocalSessionInTimeWindow localSessionId", localSessionId);

        var db = admin.database();
        var ref = db.ref("sensorRecords/" + localSessionId);

        var trackerStat = {};

        return ref.orderByChild("timestamp").startAt(startPDate.dateStr).endAt(endPDate.dateStr).once("value").then(function(filteredSnapshots) {
            //console.log("sensorRecords filteredSnapshots", filteredSnapshots.val());

            if (!trackerStat[localSessionId]) {
                trackerStat[localSessionId] = {};
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
                    trackerStat[localSessionId][targetPlayerId] = statistic;
                }
            });

            var overallStat = peeqSensorRecord.calculateOverallStatisticFromStatisticArray(statisticArray);
            overallStat.localSession = localSessionId;
            overallStat.highlightStartTime = startPDate.timeInterval; //TODO: make the highlightStartTime and highlightEndTime dynamic
            overallStat.highlightEndTime = endPDate.timeInterval;

            //save trackerStat to firebase
            if (overallStat.count > 0) {
                var statRef = db.ref("trackerStatistics/");
                statRef.set(trackerStat, function(error) {
                    if (error) {
                        console.error("Data could not be saved." + error);
                    }
                    //else {
                    //  console.log("Data saved successfully.");
                    //}
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

    //return a promise of the firebase transaction for creating the playerHighlightVideos reocrd
    this.shouldGenerateHighlightWithStatistics = function(stats) {
        //console.log("shouldGenerateHighlightWithLocalSessionIds", localSessionIds);
        if (stats.length > 0) {
            var clipInfos = stats.map(function(value) {
                var clipInfo = {};
                clipInfo.localSession = value.localSession;
                clipInfo.startTime = value.highlightStartTime;
                clipInfo.endTime = value.highlightEndTime;
                return clipInfo;
            });
            console.log("clipInfos", clipInfos);

            //try creating a new record to firebase playerHighlightVideos
            var db = admin.database();
            //var refStr = "playerHighlightVideos/" + this.val.user + "/" + this.snapshot.key; //console.log("refStr", refStr);
            var ref = db.ref("playerHighlightVideos/" + this.val.user + "/" + this.snapshot.key);

            return ref.transaction(function(currentData) {
                if (currentData === null) {
                    var newRecord = {
                        0: {
                            clipInfos: clipInfos,
                            state: 'init'
                        }
                    };
                    return newRecord;
                } else {
                    console.log("currentData", currentData);
                    //check if the target clipInfos already exist in the currentData
                    var shouldGen = true;
                    currentData.forEach(function(data) {
                        //console.log("data", data);
                        if (peeqPlayerHighlightVideo.clipInfosAreEqual(data.clipInfos, clipInfos)) {
                            console.log("clipInfos already exist for this playerHighlightVideos", clipInfos);
                            //!!! shouldGen = false;        //FIXME: commentted out for testing, restore this line for production
                        }
                    });

                    if (shouldGen) {
                        //otherwise, add the target clipInfos to currentData
                        var record = {
                            clipInfos: clipInfos,
                            state: 'init'
                        };
                        //!!! currentData.push(record);     //FIXME: commentted out for testing, restore this line for production
                        return currentData;
                    }
                }
                return; //Abort the transaction
            });

            //return Promise.resolve(true);      //TODO: Check if highlight video with the same localSessions is available or being processing
        }
        return Promise.reject("empty stats");
    };

    this.generateVideoClipWithInfo = function(clipInfo) {
        //var obj = this;
        console.log("generateVideoClipWithInfo", clipInfo);

        var db = admin.database();
        var ref = db.ref("videos/" + clipInfo.localSession);

        //TODO: Adapt for multiple videos in a localSession if needed
        //For now, there should be only one video record in ref
        return ref.once("value").then(function(snapshot) {
            if ((snapshot) && (snapshot.exists()) && (snapshot.numChildren() > 0)) {
                //var child = snapshot.child();
                var parentVal = snapshot.val();
                var videoId = Object.keys(parentVal)[0];
                var val = parentVal[videoId];

                var videoStartDate = new peeqDate.PDate(val.startDate);
                var videoEndDate = new peeqDate.PDate(val.endDate);
                var videoStartTime = videoStartDate.timeInterval;
                var videoEndTime = videoEndDate.timeInterval;
                console.log("val", val, "videoStartTime", videoStartTime, "videoEndTime", videoEndTime);

                //TODO: handle case where video end time was not saved properly

                if (clipInfo.startTime > videoEndTime) {
                    return Promise.reject("video time window out of range: clipInfo.startTime " + clipInfo.startTime + " videoEndTime " + videoEndTime);
                }
                if (clipInfo.endTime < videoStartTime) {
                    return Promise.reject("video time window out of range: clipInfo.endTime " + clipInfo.endTime + " videoStartTime " + videoStartTime);
                }

                var adjustedStartTime = (clipInfo.startTime > videoStartTime) ? clipInfo.startTime : videoStartTime;
                var adjustedEndTime = (clipInfo.endTime < videoEndTime) ? clipInfo.endTime : videoEndTime;

                var highlightStartInVideoOffset = (adjustedStartTime - videoStartTime) / 1000; //in sec
                var highlightDurationInVideo = (adjustedEndTime - adjustedStartTime) / 1000; //in sec

                console.log("highlightStartInVideoOffset", highlightStartInVideoOffset, "highlightDurationInVideo", highlightDurationInVideo);

                return Promise.resolve("TODO");
            } else {
                return Promise.reject("invalid video " + clipInfo.localSession);
            }
        });

    };

    this.generateHighlightWithPlayerHighlightVideoSnapshot = function(playerHighlightVideoSnapshot) {
        var obj = this;

        var val = playerHighlightVideoSnapshot.val();
        console.log("playerHighlightVideoSnapshot", val);

        var promises = [];
        val.clipInfos.forEach(function(clipInfo) {
            var prom = obj.generateVideoClipWithInfo(clipInfo);
            promises.push(prom);
        });

        return Promise.all(promises).then(function(value) {
            console.log("value", value);
            return Promise.resolve("TODO");
        });

    }; //end of generateHighlightWithPlayerHighlightVideo

    this.generateHighlightWithStatistics = function(stats) {
        var obj = this;
        return this.shouldGenerateHighlightWithStatistics(stats).then(function(transactionResult) {
            //console.log("shouldGenerateHighlightWithStatistics transactionResult", transactionResult);
            if ((transactionResult) && (transactionResult.committed)) {
                var playerHighlightVideosSnapshot = transactionResult.snapshot;
                if (playerHighlightVideosSnapshot.numChildren() > 0) {
                    obj.playerHighlightVideoSnapshot = playerHighlightVideosSnapshot.child(playerHighlightVideosSnapshot.numChildren() - 1); //get the last element, which is the new highlight video to be generated
                    return obj.generateHighlightWithPlayerHighlightVideoSnapshot(obj.playerHighlightVideoSnapshot);
                } else {
                    return Promise.reject("invalid playerHighlightVideosSnapshot");
                }
            } else {
                return Promise.reject("should not generate");
            }
        });
    }; //end of generateHighlightWithStatistics


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
                return obj.generateHighlightWithStatistics(selectedStats).then(function(value) {
                    console.log("value", value);
                    return Promise.resolve("TODO");
                });
            });
        });
    }; //end of generateHighlightIfNeeded

}; //End of exports.PlayerHighlight