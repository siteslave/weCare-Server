"use strict";

var Q = require('q');

module.exports = {
  getDuplicatedList: function (db, hospcode) {
    var q = Q.defer();

    var col = db.collection('person');
    col.createIndex({TYPEAREA: 1});
    col.createIndex({HOSPCODE: 1});

    col.aggregate([{
      $match: {
        TYPEAREA: {
          $in: ["1", "3"]
        },
        DISCHARGE: "9"
      }
    }, {
      $group: {
        _id: {
          cid: '$CID'
        },
        hospcode: {
          $addToSet: "$HOSPCODE"
        },
        total: {
          "$sum": 1
        }
      }
    }, {
      $match: {
        total: {
          $gt: 1
        },
        hospcode: hospcode
      }
    }]).toArray(function (err, person) {
      if (err) {
        q.reject(err)
      } else {
        q.resolve(person)
      }
    });

    return q.promise;
  },

  getPersonCID: function (db, cids) {
    var q = Q.defer();
    var col = db.collection('person');

    col.find({CID: {$in: cids}}, {
      HOSPCODE: 1, HN: 1, TYPEAREA: 1, BIRTH: 1, SEX: 1,
      CID: 1, PID: 1, NAME: 1, LNAME: 1, _id: 0
    }).toArray(function (err, rows) {
      if (err) {
        q.reject(err);
        console.log(err);
      } else {
        q.resolve(rows)
      }
    });

    return q.promise;

  },

  getReserved: function (db, cids) {
    var q = Q.defer();

    db.collection('person_reserved').createIndex({CID:1});
    db.collection('person_reserved')
      .find({CID: {$in: cids}})
      .toArray(function (err, reserveds) {
      if (err) {
        console.log(err);
        q.reject(err)
      } else {
        q.resolve(reserveds)
      }
    });

    return q.promise;
  },

  changeTypeArea: function (db, hospcode, cid, typearea) {
    var q = Q.defer();

    db.collection('person').createIndex({CID:1});
    db.collection('person').createIndex({HOSPCODE:1});

    db.collection('person')
      .updateOne({CID: cid, HOSPCODE: hospcode}, {
        $set: {TYPEAREA: typearea}
      }, (err) => {
        if (err) {
          q.reject(err);
        } else {
          q.resolve();
        }
      });

    return q.promise;
  },

  getPersonDuplicated: function (db, cid) {
    var q = Q.defer();

    db.collection('person').createIndex({CID:1});
    db.collection('person').createIndex({TYPEAREA:1});
    db.collection('hospitals').createIndex({hospcode:1});

    db.collection('person').find({CID: String(cid), TYPEAREA: {$in: ['1', '3']}, DISCHARGE: "9"}, {
      _id: 0, HOSPCODE: 1, PID: 1, CID: 1, TYPEAREA: 1, NAME: 1, LNAME: 1, SEX: 1, BIRTH: 1, D_UPDATE: 1
    }).toArray(function (err, docs) {
      if (err) {
        q.reject(err)
      }
      else {
        q.resolve(docs)
      }
    });

    return q.promise;
  },

  checkReserved: function (db, cid) {
    var q = Q.defer();

    var col = db.collection('person_reserved')
    col.createIndex({CID: 1});

    col.find({CID: String(cid)})
      .count(function (err, count) {
        if (err) q.reject(err);
        else q.resolve(count);
      });

    return q.promise;
  },

  doReserve: function (db, cid, hospcode) {
    var q = Q.defer();

    var col = db.collection('person_reserved');
    col.createIndex({CID: 1});
    col.createIndex({HOSPCODE: 1});

    col.save({HOSPCODE: String(hospcode), CID: String(cid)}, function (err) {
      if (err) {
        q.reject(err)
      } else {
        q.resolve()
      }
    });

    return q.promise;
  }
};


