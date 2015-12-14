var express = require('express');
var router = express.Router();

var moment = require('moment');
var _ = require('lodash');

// models
var emr = require('../models/emr');
var hospitals = require('../models/hospitals');
// service list
router.post('/service_list', (req, res, next) => {
  var url = req.dbUrl;
  var pid = req.body.pid;

  if (data.pid && data.hospcode) {
    MongoClient.connect(url, (err, db) => {
      if (err) {
        console.log(err);
        res.send({
          ok: false,
          msg: err
        });
      } else {
        var _services = [];
        var _hospitals = [];
        // GET cid
        emr.getCid(db, data.hospcode, data.pid)
        .then(function (cid) {
          emr.getHPID(db, cid)
          .then(function (hpid) {
            return emr.getServiceHistory(db, hpid);
          })
          .then((services) => {
            _services = services;

            _.forEach(services, (v) => {
              _hospitals.push(v.HOSPCODE);
            });

            return hospitals.getHospitals(db, _hospitals);

          })
          .then((__hospitals) => {
            var __services = [];
            _.forEach(_services, (v, i) => {
              var obj = {};
              obj.HOSPCODE = v.HOSPCODE;
              obj.PID = v.PID;
              var idxHOS = _.findIndex(__hospitals, {hospcode: v.HOSPCODE});
              obj.HOSPNAME = idxHOS >= 0 ? __hospitals[idxHOS].hosptype + __hospitals[idxHOS].name : '';
              obj.DATE_SERV = v.DATE_SERV;
              obj.TIME_SERV = v.TIME_SERV;
              obj.STR_TIME = v.STR_TIME;

              __services.push(obj);
            });
            db.close();
            res.send({ok: true, rows: __services});
          }, function (err) {
            db.close();
            console.log(err);
            res.send({ok: false, msg: err});
          })
        }, function (err) {
          db.close();
          console.log(err);
        });
      }
    });
  } else {
    res.send({ok: false, msg: 'ข้อมูลไม่สมบูรณ์'})
  }


});

module.exports = router;
