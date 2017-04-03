var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;
var peeqDate = require("/peeq-date");

exports.PlayerHighlight = function PlayerHighlight (id, snapshot) {
  this.id = id;
  if (snapshot) {
    this._snapshot = snapshot;
  }

  //return a promise of snapshot?
  this.fetchSnapshot = function() {
    return peeqFirebase.snapshotOf("playerHighlights/" + this.id).then(function(snapshot) {
      this._snapshot = snapshot;
      return Promise.resolve(snapshot);
    });
  };

  //return a promise of snapshot?
  this.fetchSnapshotIfNeeded = function() {
    return (this._snapshot ? Promise.resolve(this._snapshot) : this.fetchSnapshot());
  };


  //return promise of RelatedLocalSessionSnapshots array
  this.fetchRelatedLocalSessionSnapshots = function() {
    return this.fetchSnapshotIfNeeded().then(function(snapshot) {
        if ((snapshot) && (snapshot.exists())) {
          var val = snapshot.val();

          var db = admin.database();
          var ref = db.ref("localSessions");

          var endAtStr = peeqDate.dateStrWithTimeOffset(val.timestamp, (3600000*6));
          console.log("endAtStr", endAtStr);

          return ref.orderByChild("endDate").startAt(val.timestamp).endAt(endAtStr).once("value").then(function(filteredSnapshot) {

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
          Promise.reject("invalid playerHighlight");
        }
    });
  };
  //End of fetchRelatedLocalSessionSnapshots




  this.generateHighlightIfNeeded = function() {
    return this.fetchSnapshotIfNeeded().then(function(snapshot) {

      if ((snapshot) && (snapshot.exists())) {

        var val = snapshot.val();
        //console.log("val", val);

        return this.fetchRelatedLocalSessionSnapshots().then(function(relatedLocalSessionSnapshots) {
          relatedLocalSessionSnapshots.forEach(function(childSnapshot) {
            console.log("relatedLocalSession", childSnapshot.val());
          });
        });











      }
      else {
        Promise.reject("invalid playerHighlight");
      }

    });
  };
};
