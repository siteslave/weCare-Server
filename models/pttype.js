
"use strict";

let Q = require('q');

module.exports = {
  getList: (db, codes) => {
    let q = Q.defer();
    db.collection('l_pttype')
      .find({
        code: { $in: codes}
      }, { _id: 0 })
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
}