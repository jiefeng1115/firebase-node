var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

/*
//return a promise of snapshot? of the localSessions/id
exports.snapshotOf = function(id) {
  return peeqFirebase.snapshotOf("localSessions/" + id);
};
*/

/*
exports.test = function() {
  var db = admin.database();
  var ref = db.ref("localSessions");
  ref.orderByChild("user").equalTo('W4FoiXe2KcYwu7swdxDR67NHFcj2').once("value").then(function(snapshot) {
    console.log(snapshot.val());
  });
};
*/

exports.LocalSession = function LocalSession (id, snapshot) {
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
      }
      else {
        return Promise.reject("invalid snapshot" + obj.id);
      }
    });
  };

  //return a promise of the original obj, with snapshot assigned to obj.snapshot
  this.fetchSnapshotIfNeeded = function() {
    return (this.snapshot ? Promise.resolve(this) : this.fetchSnapshot());
  };





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

};    //End of exports.LocalSession
