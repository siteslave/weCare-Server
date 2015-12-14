var Q = require('q');
var _ = require('lodash');
var moment = require('moment');

module.exports = {
  getCid: function (db, hospcode, pid) {
    var q = Q.defer();

    db.collection('person')
    .find({HOSPCODE: hospcode, PID: pid}, {_id: 0, CID: 1})
    .limit(1)
    .toArray(function (err, docs) {
      if (err) {
        console.log(err);
        q.reject(err);
      } else {
        console.log(docs);
        q.resolve(docs[0].CID);
      }
    })

    return q.promise;
  },
  
  getHPID: function(db, cid) {
    var q = Q.defer();

    db.collection('person').aggregate([{
      $match: {
        CID: String(cid)
      }
    }, {
      $project: {
        HPID: {
          $concat: ["$HOSPCODE", "$PID"]
        }
      }
    }]).toArray(function(err, docs) {
      console.log(docs);
      if (err) {
        q.reject(err);
      } else {
        var hpid = [];
        _.forEach(docs, function(v) {
          hpid.push(v.HPID);
        });

        q.resolve(hpid);
      }
    });

    return q.promise;

  },

  getServiceHistory: function(db, hpid) {
    var q = Q.defer();

    db.collection('service').aggregate([{
      $project: {
        HPID: {
          $concat: ["$HOSPCODE", "$PID"]
        },
        PID: "$PID",
        DATE_SERV: "$DATE_SERV",
        TIME_SERV: "$TIME_SERV",
        SEQ: "$SEQ",
        HOSPCODE: "$HOSPCODE",
      }
    }, {
      $match: {
        HPID: {
          $in: hpid
        }
      },
    }, {
      $limit: 10
    }, {
      $sort: {DATE_SERV: -1}
    }]).toArray(function(err, docs) {
      //console.log(docs);
      if (err) {
        q.reject(err);
      } else {
        var services = [];
        _.forEach(docs, function (v) {
          var obj = {};
          obj.HOSPCODE = v.HOSPCODE;
          obj.PID = v.PID;
          obj.SEQ = v.SEQ;
          obj.HPID = v.HPID;
          obj.DATE_SERV = moment(v.DATE_SERV).format('DD/MM/YYYY');
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

  }
}
