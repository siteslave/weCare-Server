"use strict";

var express = require('express');
var router = express.Router();

var moment = require('moment');
var _ = require('lodash');
var fse = require('fs-extra');
var rimraf = require('rimraf');
var dashboard = require('../models/dashboard');
let Auth = require('../models/auth');

/* GET home page. */
router.post('/surveillance',(req, res, next) => {

  let dbMysql = req.dbMySQL;
  let hospcode = req.body.hospcode;
  let start = req.body.start;
  let end = req.body.end;
  let _key = req.body._key;
  let _hospcode = req.body._hospcode;

  let db = req.db;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
    .then((success) => {
      if (success) {
        dashboard.geVillagetList(db, hospcode)
          .then((villages) => {
            dashboard.getSurveillanceList(dbMysql, start, end, villages)
              .then((rows) => {
                res.send({ok: true, rows: rows});
              }, (err) => {
                console.log(err);
                res.send({ok: false, msg: err});
              })
          }, (err) => {
            res.send({ok: false, msg: err});
          })
      } else {
        res.send({ok: false, msg: 'Access dined!'})
      }
    }, (err) => {
      res.send({ok: false, msg: err})
    });
  // get village list

});


router.post('/surveillance/detail',(req, res, next) => {

  let dbMysql = req.dbMySQL;
  let vn = req.body.vn;
  let _key = req.body._key;
  let _hospcode = req.body._hospcode;

  let db = req.db;

  let __key = Auth.decrypt(_key);
  let services = {};

  Auth.doAuth(db, _hospcode, __key)
    .then((success) => {
      if (success) {
        dashboard.getSurveillanceDiag(dbMysql, vn)
          .then((diag) => {
            services.diag = diag;
            return dashboard.getSurveillanceDrug(dbMysql, vn);
          })
          .then((drug) => {

            services.drug = drug;
            return dashboard.getSurveillanceLab(dbMysql, vn);
          })
          .then((lab) => {
            services.lab = lab;
            return dashboard.getSurveillanceScreening(dbMysql, vn);
          })
          .then((screen) => {
            services.screen = screen[0];
            res.send({ok: true, rows: services});
          }, (err) => {
            console.log(err);
            res.send({ok: false, msg: err});
          })
      } else {
        res.send({ok: false, msg: 'Access dined!'})
      }
    }, (err) => {
      console.log(err);
      res.send({ok: false, msg: err})
    });
  // get village list

});

router.post('/labor',(req, res, next) => {

  let dbMysql = req.dbMySQL;
  let hospcode = req.body.hospcode;
  let start = req.body.start;
  let end = req.body.end;
  let _key = req.body._key;
  let _hospcode = req.body._hospcode;

  let db = req.db;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
    .then((success) => {
      if (success) {
        dashboard.geVillagetList(db, hospcode)
          .then((villages) => {
            dashboard.getLabor(dbMysql, start, end, villages)
              .then((rows) => {
                res.send({ok: true, rows: rows});
              }, (err) => {
                res.send({ok: false, msg: err});
              })
          }, (err) => {
            res.send({ok: false, msg: err});
          })
      } else {
        res.send({ok: false, msg: 'Access dined!'})
      }
    }, (err) => {
      res.send({ok: false, msg: err})
    });
  // get village list

});

router.post('/labor/detail',(req, res, next) => {

  let dbMysql = req.dbMySQL;
  let pid = req.body.pid;
  let _key = req.body._key;
  let _hospcode = req.body._hospcode;

  let db = req.db;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
    .then((success) => {
      if (success) {
        dashboard.getLaborDetail(dbMysql, pid)
          .then((rows) => {
            console.log(rows);
            res.send({ok: true, rows: rows[0]});
          }, (err) => {
            res.send({ok: false, msg: err});
          })
      } else {
        res.send({ok: false, msg: 'Access dined!'})
      }
    }, (err) => {
      res.send({ok: false, msg: err})
    });
  // get village list

});

module.exports = router;
