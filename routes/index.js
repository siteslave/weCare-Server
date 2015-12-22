"use strict";

var express = require('express');
var router = express.Router();

var moment = require('moment');
var _ = require('lodash');
var fse = require('fs-extra');
var rimraf = require('rimraf');
var Auth = require('../models/auth');

var multer  = require('multer');
var uploadDir = './public/uploads';

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fse.ensureDirSync(uploadDir);
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

var upload = multer({ storage: storage });

var Typearea = require('../models/typearea');
var Hospitals = require('../models/hospitals');
/* GET home page. */
router.get('/',(req, res, next) => {
  res.send({ok: true, msg: `Welcome to weCare Server`, server_time: new Date()});
});

router.post('/uploads', upload.array('files'), (req, res, next) => {
  let db = req.db;
  let _key = req.body._key;
  let _hospcode = req.body._hospcode;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      res.send({ok: true});
    } else {
      // remove uploaded file;
      req.files.forEach((v) => {
        rimraf.sync(v.path);
      });
      res.send({ok: false, msg: 'Access denied!'})
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  })

});

router.post('/detail', (req, res, next) => {

  let cid = req.body.cid;
  let _hospcode = req.body._hospcode;
  let _key = req.body._key;

  let db = req.db;
  let person = [];
  let hospitals = [];

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      if (!cid) {
        res.send({ok: false, msg: 'No CID found!'});
      } else {
        Typearea.getPersonDuplicated(db, cid)
          .then((docs) => {
            console.log(docs);

            let _hospitals = [];
            person = docs;
            // get Hostial name
            _.forEach(docs, (v) => {
              _hospitals.push(String(v.HOSPCODE));
            });

            return Hospitals.getHospitals(db, _hospitals);
          })
          .then((hos) => {
            hospitals = hos;

            let _cids = [];
            _.forEach(person, (v) => {
              _cids.push(String(v.CID));
            });

            return Typearea.getReserved(db, _cids);
          })
          .then((reserveds) => {
            let data = [];
            _.forEach(person, (v) => {
              //console.log(v);
              let obj = {};
              let idxHos = _.findIndex(hospitals, {hospcode: v.HOSPCODE});
              let idxReserved = _.findIndex(reserveds, {CID: v.CID});
              obj.hospcode = v.HOSPCODE;
              obj.hospname = idxHos >= 0 ? hospitals[idxHos].hosptype + hospitals[idxHos].name : '';
              //obj.reserved = idxReserved >= 0 ? _hospitals[idxHos].hosptype + _hospitals[idxHos].name : '';
              if (idxReserved >= 0) {
                if (v.HOSPCODE == reserveds[idxReserved].HOSPCODE) {
                  obj.reserved = 'Y';
                } else {
                  obj.reserved = 'N';
                }
              } else {
                obj.reserved = 'N';
              }

              obj.typearea = v.TYPEAREA;
              obj.fname = v.NAME;
              obj.lname = v.LNAME;
              obj.sex = v.SEX == '1' ? 'ชาย' : 'หญิง';

              let y = parseInt(moment(v.BIRTH, 'x').get('year')) + 543;
              obj.birth = moment(v.BIRTH, 'x').format('DD/MM') + '/' + String(y);
              obj.d_update = moment(v.D_UPDATE, 'x').format('DD/MM/YYYY');

              data.push(obj);
            });

            res.send({ok: true, rows: data})

          }, (err) => {
            res.send({ok: false, msg: err})
          })
      }
    } else {
      res.send({ok: false, msg: 'Access denied!'})
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  });

});

router.post('/typearea', (req, res, next) => {

  var _hospcode = req.body._hospcode;
  var _key = req.body._key;
  var hospcode = req.body.hospcode;

  var db = req.db;
  var person = [];
  var cids = [];

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      Typearea.getDuplicatedList(db, hospcode)
        .then((rows) => {
          _.forEach(rows, (v) => {
            cids.push(v._id.cid);
          });
          return Typearea.getPersonCID(db, cids);
        })
        .then((rows) => {
          person = rows;
          return Typearea.getReserved(db, cids)
        })
        .then((reserveds) => {
          var data = [];
          _.forEach(person, (v) => {
            if (v.HOSPCODE == hospcode) {
              var obj = {};

              var idxReserved = _.findIndex(reserveds, {CID: v.CID});

              obj.cid = v.CID;
              obj.pid = v.PID;
              obj.hn = v.HN;
              obj.hospcode = v.HOSPCODE;
              obj.fname = v.NAME;
              obj.lname = v.LNAME;
              obj.sex = v.SEX;
              obj.age = parseInt(moment().get('year')) - parseInt(moment(v.BIRTH, 'x').get('year'));
              var y = parseInt(moment(v.BIRTH, 'x').get('year')) + 543;
              obj.birth = moment(v.BIRTH, 'x').format('DD/MM') + '/' + String(y);
              obj.typearea = v.TYPEAREA;

              if (idxReserved >= 0) {
                obj.reserved_hosp = reserveds[idxReserved].HOSPCODE;
                obj.isOwner = obj.reserved_hosp == hospcode ? 'Y' : 'N';
                obj.reserved = 'Y';
              } else {
                obj.reserved_hosp = '';
                obj.isOwner = '';
                obj.reserved = 'N';
              }

              data.push(obj);
            }
          });

          res.send({ok: true, rows: data})
        }, (err) => {
          res.send({ok: false, msg: err})
        })
    } else {
      res.send({ok: false, msg: 'Access denied!'})
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  });
});

router.post('/reserve', (req, res, next) => {
  var _hospcode = req.body._hospcode;
  var _key = req.body._key;
  var hospcode = req.body.hospcode;

  var cid = req.body.cid;
  var db = req.db;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      Typearea.checkReserved(db, cid)
        .then((count) => {
          if (count) {
            res.send({ok: false, msg: 'รายการนี้ถูกจองแล้ว ไม่สามารถจองได้อีก'})
          } else {

            Typearea.doReserve(db, cid, hospcode)
              .then(() => {
                res.send({ok: true})
              }, (err) => {
                res.send({ok: false, msg: err})
              })
          }
        }, (err) => {
          res.send({ok: false, msg: err})
        });
    } else {
      res.send({ok: false, msg: 'Access denied!'})
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  });

});

router.post('/change-typearea', (req, res, next) => {
  let _hospcode = req.body._hospcode;
  let _key = req.body._key;
  let hospcode = req.body.hospcode;
  let cid = req.body.cid;
  let typearea = req.body.typearea;

  let db = req.db;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      if (cid && typearea && hospcode) {
        Typearea.changeTypeArea(db, hospcode, cid, typearea)
          .then(() => {
            res.send({ok: true})
          }, (err) => {
            res.send({ok: false, msg: err})
          });
      } else {
        res.send({ok: false, msg: 'ข้อมูลไม่สมบูรณ์'})
      }

    } else {
      res.send({ok: false, msg: 'Access denied!'})
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  });

});

module.exports = router;
