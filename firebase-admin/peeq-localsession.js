var peeqFirebase = require("./peeq-firebase");
var admin = peeqFirebase.admin;

/*
//return a promise of snapshot? of the localSessions/id
exports.snapshotOf = function(id) {
  return peeqFirebase.snapshotOf("localSessions/" + id);
};
*/

exports.test = function() {
  var db = admin.database();
  var ref = db.ref("localSessions");
  ref.orderByChild("user").equalTo('W4FoiXe2KcYwu7swdxDR67NHFcj2').once("value").then(function(snapshot) {
    console.log(snapshot.val());
  });
};

exports.LocalSession = function LocalSession (id) {
  this.id = id;

  //return a promise of snapshot?
  this.fetchSnapshot = function() {
    return peeqFirebase.snapshotOf("localSessions/" + this.id).then(function(snapshot) {
      this._snapshot = snapshot;
      return Promise.resolve(snapshot);
    });
  };

  //return a promise of snapshot?
  this.fetchSnapshotIfNeeded = function() {
    return (this._snapshot ? Promise.resolve(this._snapshot) : this.fetchSnapshot());
  };






  this.fetchRelatedLocalSessions = function() {
    return this.fetchSnapshotIfNeeded().then(function(snapshot) {
        if ((snapshot) && (snapshot.exists())) {
          var val = snapshot.val();

          var db = admin.database();
          var ref = db.ref("localSessions");
          return ref.orderByChild("user").equalTo(val.user).once("value").then(function(snapshot) {
            //console.log(snapshot.val());

//snapshot.forEach({})



          });
        }
        else {
          Promise.reject("invalid snapshot");
        }
    });
  };



/*
  this.fetchRelatedHighLightRecords = function() {
    return this.fetchSnapshotIfNeeded().then(function(snapshot) {
        if ((snapshot) && (snapshot.exists())) {
          var val = snapshot.val();



        }
        else {
          Promise.reject("invalid snapshot");
        }
    });
  };
*/

};
