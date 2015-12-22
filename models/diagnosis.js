"use strict";

let Q = require('q');

module.exports = {
  // Get diag list
  getDiagList: (db, icds) => {
    let q = Q.defer();
    db.collection('l_icd10')
      .find({code: {$in: icds}}, { _id: 0 })
      .toArray((err, docs) => {
        if (err) {
          console.log(err);
          q.reject(err);
        } else {
          q.resolve(docs);
        }
      });

    return q.promise;

  }
};