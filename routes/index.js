var express = require('express');
var router = express.Router();

var moment = require('moment');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var cryptojs = require('crypto-js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

router.post('/detail', function (req, res, next) {

  var url = req.dbUrl;
  var cid = req.body.cid;

  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err);
      res.send({
        ok: false,
        msg: err
      });
    } else {
      db.collection('person').createIndex({CID:1});
      db.collection('hospitals').createIndex({hospcode:1});

      db.collection('person').find({CID: String(cid), TYPEAREA: {$in: ['1', '3']}}, {
        _id: 0, HOSPCODE: 1, PID: 1, CID: 1, TYPEAREA: 1, NAME: 1, LNAME: 1, SEX: 1, BIRTH: 1, D_UPDATE: 1
      }).toArray(function (err, docs) {
        if (err) {
          db.close();
          res.send({ok: false, msg: err});
        }
        else {
          var person = docs;
          // get Hostial name
          var hospitals = [];
          _.forEach(docs, function (v) {
            hospitals.push(String(v.HOSPCODE));
          });

          db.collection('hospitals').find({hospcode: {$in: hospitals}}).toArray(function (err, hos) {
            if (err) {
              db.close();
              res.send({ok: false, msg: err});
            } else {
              var _hospitals = hos;
              var _person = [];

              // db.collection('person_reserved').find({cid: {$in: }})
              var cids = [];

              _.forEach(person, function (v) {
                cids.push(String(v.CID));
              });

              db.collection('person_reserved').find({CID: {$in: cids}}).toArray(function (err, reserveds) {
                if (err) {
                  db.close();
                  res.send({ok: false, msg: err});
                } else {
                  _.forEach(person, function (v) {
                    //console.log(v);
                    var obj = {};
                    var idxHos = _.findIndex(_hospitals, {hospcode: v.HOSPCODE});
                    var idxReserved = _.findIndex(reserveds, {CID: v.CID});
                    obj.hospcode = v.HOSPCODE;
                    obj.hospname = idxHos >= 0 ? _hospitals[idxHos].hosptype + _hospitals[idxHos].name : '';
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
                    var y = parseInt(moment(v.BIRTH).get('year')) + 543;
                    obj.birth = moment(v.BIRTH).format('DD/MM') + '/' + String(y);
                    obj.d_update = moment(v.D_UPDATE).format('DD/MM/YYYY');

                    _person.push(obj);
                  });

                  db.close();
                  res.send({ok: true, rows: _person});
                }
              })

            }
          })
        }
      });
    }

  });


});

router.post('/typearea', function (req, res, next) {
  var url = req.dbUrl;
  var hospcode = req.body.hospcode;

  // var bytes = cryptojs.AES.decrypt(query, req.key);
  // var data = bytes.toString(cryptojs.enc.Utf8);
  // data = JSON.parse(data);
  //
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err);
      res.send({
        ok: false,
        msg: err
      });
    } else {

      var col = db.collection('person');
      col.createIndex({TYPEAREA: 1});
      col.createIndex({HOSPCODE: 1});

      col.aggregate([{
        $match: {
          TYPEAREA: {
            $in: ["1", "3"]
          }
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
          db.close();
          res.send({ok: false, msg: err})
        } else {
          var cids = [];
          _.forEach(person, function (v) {
            cids.push(v._id.cid);
          })
          col.find({CID: {$in: cids}}, {
            HOSPCODE: 1, HN: 1, TYPEAREA: 1, BIRTH: 1,
            CID: 1, PID: 1, NAME: 1, LNAME: 1, _id: 0
          }).toArray(function (err, rows) {
            if (err) {
              db.close();
              res.send({ok: false, msg: err});
            } else {

              var person = rows;

              db.collection('person_reserved').find({CID: {$in: cids}}).toArray(function (err, reserveds) {
                if (err) {
                  db.close();
                  res.send({ok: false, msg: err});
                } else {
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
                      obj.age = parseInt(moment().get('year')) - parseInt(moment(v.BIRTH).get('year'));
                      var y = parseInt(moment(v.BIRTH).get('year')) + 543;
                      obj.birth = moment(v.BIRTH).format('DD/MM') + '/' + String(y);
                      obj.typearea = v.TYPEAREA;

                      if (idxReserved >= 0) {
                        obj.reserved_hosp = reserveds[idxReserved].HOSPCODE;
                        obj.reserved = 'Y';
                      } else {
                        obj.reserved_hosp = '';
                        obj.reserved = 'N';
                      }

                      data.push(obj);
                    }
                  });

                  db.close();
                  console.log(data);
                  res.send({ok: true, rows: data});
                }
              })
            }
          })

        }
      })

    }

  });

});

router.post('/reserve', function (req, res, next) {
  var url = req.dbUrl;
  var hospcode = req.body.hospcode;
  var cid = req.body.cid;

  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err);
      res.send({
        ok: false,
        msg: err
      });
    } else {

      var col = db.collection('person_reserved');
      col.createIndex({CID: 1});
      col.createIndex({HOSPCODE: 1});

      col.save({HOSPCODE: String(hospcode), CID: String(cid)}, function (err) {
        if (err) {
          db.close();
          res.send({ok: false, msg: err});
        } else {
          db.close();
          res.send({ok: true});
        }

      });
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
