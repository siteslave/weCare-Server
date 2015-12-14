var express = require('express');
var router = express.Router();

var moment = require('moment');
var _ = require('lodash');

var Typearea = require('../models/typearea');
var Hospitals = require('../models/hospitals');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({ok: true, msg: `Welcome to weCare Server`, server_time: new Date()})
});

router.post('/detail', function (req, res, next) {

  var cid = req.body.cid;
  var db = req.db;
  var person = [];
  var hospitals = [];

  if (!cid) {
    res.send({ok: false, msg: 'No CID found!'})
  } else {
    Typearea.getPersonDuplicated(db, cid)
      .then(function (docs) {
        console.log(docs);

        var _hospitals = [];
        person = docs;
        // get Hostial name
        _.forEach(docs, function (v) {
          _hospitals.push(String(v.HOSPCODE));
        });

        return Hospitals.getHospitals(db, _hospitals);
      })
      .then(function (hos) {
        hospitals = hos;

        var _cids = [];
        _.forEach(person, function (v) {
          _cids.push(String(v.CID));
        });

        return Typearea.getReserved(db, _cids);
      })
      .then(function (reserveds) {
        var data = [];
        _.forEach(person, function (v) {
          //console.log(v);
          var obj = {};
          var idxHos = _.findIndex(hospitals, {hospcode: v.HOSPCODE});
          var idxReserved = _.findIndex(reserveds, {CID: v.CID});
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
          var y = parseInt(moment(v.BIRTH, 'x').get('year')) + 543;
          obj.birth = moment(v.BIRTH, 'x').format('DD/MM') + '/' + String(y);
          obj.d_update = moment(v.D_UPDATE, 'x').format('DD/MM/YYYY');

          data.push(obj);
        });

        res.send({ok: true, rows: data})

      }, function (err) {
        res.send({ok: false, msg: err})
      })
  }


});

router.post('/typearea', function (req, res, next) {

  var hospcode = req.body.hospcode;
  var db = req.db;
  var person = [];
  var cids = [];

  Typearea.getDuplicatedList(db, hospcode)
    .then(function (rows) {
      _.forEach(rows, function (v) {
        cids.push(v._id.cid);
      });
      return Typearea.getPersonCID(db, cids);
    })
    .then(function (rows) {
      person = rows;
      return Typearea.getReserved(db, cids)
    })
    .then(function (reserveds) {
      var data = [];
      _.forEach(person, function (v) {
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
    }, function (err) {
      res.send({ok: false, msg: err})
    })

});

router.post('/reserve', function (req, res, next) {
  var hospcode = req.body.hospcode;
  var cid = req.body.cid;
  var db = req.db;

  Typearea.checkReserved(db, cid)
    .then(function (count) {
      if (count) {
        res.send({ok: false, msg: 'รายการนี้ถูกจองแล้ว ไม่สามารถจองได้อีก'})
      } else {

        Typearea.doReserve(db, cid, hospcode)
          .then(function () {
            res.send({ok: true})
          }, function (err) {
            res.send({ok: false, msg: err})
          })
      }
    });

});

// test synchronized
router.get('/sync/:cid', function (req, res, next) {
  var url = req.dbUrl;
  var cid = req.params.cid;

  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err);
      res.send({
        ok: false,
        msg: err
      });
    } else {

      var col = db.collection('person');
      col.createIndex({CID: 1});
      var person = col.find({CID: String(cid)}).toArray();
      res.send({ok: true, rows: person});
    }
  });
});

module.exports = router;
