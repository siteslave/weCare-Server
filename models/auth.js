"use strict";

let Q = require('q');
let _ = require('lodash');

var crypto = require('crypto');

var algorithm = 'aes-256-ctr';
var salt = 'mANiNThEdARk';

module.exports = {
  // Get diag list
  doAuth: (db, hospcode, key) => {
    let q = Q.defer();
    db.collection('auth')
      .find({hospcode: hospcode, key: key}, { _id: 0 })
      .toArray((err, docs) => {
        if (err) {
          console.log(err);
          q.reject(err);
        } else {
          let success = _.size(docs) ? true : false;
          q.resolve(success);
        }
      });

    return q.promise;

  },
  encrypt: (key) => {
    let cipher = crypto.createCipher(algorithm, salt);
    let crypted = cipher.update(key,'utf8','hex');
    crypted += cipher.final('hex');

    return crypted;
  },
  decrypt: (key) => {
    let decipher = crypto.createDecipher(algorithm, salt);
    let dec = decipher.update(key,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
  }
};