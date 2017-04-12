/*jshint esversion: 6 */

var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("./peeq-date");

const relatedLocalSessionsStartDataTimeOffsetStartAt = -peeqDate.milliSecToMinute * 30; //30 min before
const relatedLocalSessionsStartDataTimeOffsetEndAt = peeqDate.milliSecToMinute * 30; //30 min after

exports.LocalSession = function LocalSession(id, snapshot) {
    this.id = id;
    if (snapshot) {
        this.snapshot = snapshot;
    }

    //return a promise of the original obj, with snapshot assigned to obj.snapshot
    this.fetchSnapshot = function() {
        var obj = this;
        return peeqFirebase.snapshotOf("localSessions/" + obj.id).then(function(snapshot) {
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



    //fetch related localSessionSnapshots started within 0.5 hr before or 0.5 hr after this localSession
    this.fetchRelatedLocalSessionSnapshots = function() {
        return this.fetchSnapshotIfNeeded().then(function(obj) {
            var val = obj.val;
            var targetStartPDate = new peeqDate.PDate(val.startDate);

            var filterStartDateStrStartAt = targetStartPDate.dateStrWithTimeOffset(relatedLocalSessionsStartDataTimeOffsetStartAt);
            var filterStartDateStrEndAt = targetStartPDate.dateStrWithTimeOffset(relatedLocalSessionsStartDataTimeOffsetEndAt);

            var db = admin.database();
            var ref = db.ref("localSessions");

            return ref.orderByChild("startDate").startAt(filterStartDateStrStartAt).endAt(filterStartDateStrEndAt).once("value").then((filteredSnapshots) => {
                var relatedSnapshots = [];
                filteredSnapshots.forEach(function(childSnapshot) {
                    //console.log("childSnapshot", childSnapshot.val());
                    if (peeqFirebase.isRelated(obj.snapshot, childSnapshot)) {
                        relatedSnapshots.push(childSnapshot);
                        //console.log("relatedSnapshots", relatedSnapshots);
                    }
                });
                //obj.relatedLocalSessionSnapshots = relatedSnapshots;
                return Promise.resolve(relatedSnapshots);
            }); //end of orderByChild
        });
    }; //end of fetchRelatedLocalSessionSnapshots



    /*
      //return promise of RelatedPlayerHighLightSnapshots array
      //TODO: FIREBASE WARNING: Using an unspecified index. Consider adding ".indexOn": "timestamp" at /playerHighlights to your security rules for better performance
      this.fetchRelatedPlayerHighLightSnapshots = function() {
        return this.fetchSnapshotIfNeeded().then(function(snapshot) {
            if ((snapshot) && (snapshot.exists())) {
              var val = snapshot.val();
              //console.log("val", val);

              var db = admin.database();
              var ref = db.ref("playerHighlights");

              return ref.orderByChild("timestamp").startAt(val.startDate).endAt(val.endDate).once("value").then(function(filteredSnapshot) {

                //console.log("filteredSnapshot.val", filteredSnapshot.val());
                var relatedSnapshots = [];

                filteredSnapshot.forEach(function(childSnapshot) {
                  if (peeqFirebase.isRelated(snapshot, childSnapshot)) {
                      //console.log("isRelated", childSnapshot.val());
                      relatedSnapshots.push(childSnapshot);
                  }
                });

                return Promise.resolve(relatedSnapshots);

              });

            }
            else {
              Promise.reject("invalid localSession");
            }
        });
      };
      //End of fetchRelatedPlayerHighLightSnapshots
    */

}; //End of exports.LocalSession