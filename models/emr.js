"use strict";

var Q = require('q');
var _ = require('lodash');
var moment = require('moment');

module.exports = {
  getDetail: (db, hospcode, pid, seq) => {
    var q = Q.defer();

    var col = db.collection('service');
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});
    col.createIndex({SEQ: 1});

    db.collection('service')
      .find({
        HOSPCODE: hospcode,
        PID: pid,
        SEQ: seq
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
  },

  getHPID: (db, cid) => {
    var q = Q.defer();

    var col = db.collection('person');
    col.createIndex({CID: 1});
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});

    col.aggregate([{
      $match: {
        CID: String(cid)
      }
    }, {
      $project: {
        HPID: {
          $concat: ["$HOSPCODE", "$PID"]
        }
      }
    }]).toArray((err, docs) => {
      console.log(docs);
      if (err) {
        q.reject(err);
      } else {
        var hpid = [];
        _.forEach(docs, (v) => {
          hpid.push(v.HPID);
        });

        q.resolve(hpid);
      }
    });

    return q.promise;

  },

  getServiceHistory: (db, hpid) => {
    var q = Q.defer();

    var col = db.collection('service');
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});

    col.aggregate([{
      $project: {
        HPID: {
          $concat: ["$HOSPCODE", "$PID"]
        },
        PID: "$PID",
        DATE_SERV: "$DATE_SERV",
        TIME_SERV: "$TIME_SERV",
        SEQ: "$SEQ",
        HOSPCODE: "$HOSPCODE"
      }
    }, {
      $match: {
        HPID: {
          $in: hpid
        }
      }
    }, {
      $limit: 10
    }, {
      $sort: {
        DATE_SERV: -1
      }
    }]).toArray((err, docs) => {
      //console.log(docs);
      if (err) {
        q.reject(err);
      } else {
        var services = [];
        _.forEach(docs, (v) => {
          var obj = {};
          obj.HOSPCODE = v.HOSPCODE;
          obj.PID = v.PID;
          obj.SEQ = v.SEQ;
          obj.HPID = v.HPID;
          obj.DATE_SERV = moment(v.DATE_SERV, 'x').format('DD/MM/YYYY');
          obj.TIME_SERV = moment(v.TIME_SERV, 'HHmmss').format('HH:mm:ss');
          var strTime = obj.DATE_SERV + ' ' + obj.TIME_SERV;
          strTime = moment(strTime, 'DD/MM/YYYY HH:mm:ss').format('x');
          obj.STR_TIME = strTime;
          services.push(obj);
        });

        q.resolve(services);
      }
    });

    return q.promise;

  },

  getDiagnosisOPD: (db, hospcode, pid, seq) => {
    let q = Q.defer();

    var col = db.collection('diagnosis_opd');
    col.createIndex({SEQ: 1});
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});

    col
      .find({
        HOSPCODE: hospcode,
        PID: pid,
        SEQ: seq
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
  },

  getProcedureOpd: (db, hospcode, pid, seq) => {
    let q = Q.defer();

    var col = db.collection('procedure_opd');
    col.createIndex({SEQ: 1});
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});

    col
      .find({
        HOSPCODE: hospcode,
        PID: pid,
        SEQ: seq
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
  },

  getDrugOpd: (db, hospcode, pid, seq) => {
    let q = Q.defer();

    var col = db.collection('drug_opd');
    col.createIndex({SEQ: 1});
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});

    col
      .find({
        HOSPCODE: hospcode,
        PID: pid,
        SEQ: seq
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
  },

  getLabFu: (db, hospcode, pid, seq) => {
    let q = Q.defer();

    var col = db.collection('labfu');
    col.createIndex({SEQ: 1});
    col.createIndex({HOSPCODE: 1});
    col.createIndex({PID: 1});

    col
      .find({
        HOSPCODE: hospcode,
        PID: pid,
        SEQ: seq
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
};
