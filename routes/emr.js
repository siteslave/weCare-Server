"use strict";

let express = require('express');
let router = express.Router();

let moment = require('moment');
let _ = require('lodash');

// models
let Emr = require('../models/emr');
let Hospitals = require('../models/hospitals');
let Pttype = require('../models/pttype');
let Diagnosis = require('../models/diagnosis');
let Procedure = require('../models/procedure');
let LabFu = require('../models/labfu');
let Auth = require('../models/auth');
// Get detail
router.post('/detail', (req, res, next) => {
  let hospcode = req.body.hospcode;
  let pid = req.body.pid;
  let seq = req.body.seq;
  //let hospcode = '04954';
  //let pid = '002267';
  //let seq = '276751';

  let _key = req.body._key;
  let _hospcode = req.body._hospcode;

  let db = req.db;

  let pttypes = [];
  let services = [];

  let results = {};

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      if (!hospcode || !pid || !seq) {
        res.send({ok: false, msg: 'ข้อมูลไม่สมบูรณ์'});
      } else {
        Emr.getDetail(db, hospcode, pid, seq)
          .then((docs) => {
            services = docs;
            docs.forEach((v) => {
              pttypes.push(v.INSTYPE);
            });

            return Pttype.getList(db, pttypes);

          })
          .then((_pttypes) => {
            pttypes = _pttypes;

            let data = [];
            services.forEach((v) => {
              let obj = {};
              obj.date_serv = moment(v.DATE_SERV, 'x').format('DD/MM/YYYY');
              obj.time_serv = moment(v.TIME_SERV, 'HHmmss').format('HH:mm:ss');
              obj.cc = v.CC;

              obj.typein = v.TYPEIN == '1' ? 'มารับบริการเอง' :
                v.TYPEIN == '2' ? 'มารับบริการตามนัดหมาย' :
                  v.TYPEIN == '3' ? 'ได้รับการส่งต่อจากสถานพยาบาลอื่น' :
                    v.TYPEIN == '4' ? 'ได้รับการส่งตัวจากบริการ EMS' : 'ไม่ระบุ';

              let _idx_pttype = _.findIndex(pttypes, {code: v.INSTYPE});
              obj.pttype_name = _idx_pttype >= 0 ? pttypes[_idx_pttype].name : '';

              obj.pttype_code = v.INSID;
              obj.cc = v.CHIEFCOMP;
              obj.btemp = v.BTEMP;
              obj.bp = `${v.SBP}/${v.DBP}`;
              obj.pr = v.PR;
              obj.rr = v.RR;

              data.push(obj);

            });

            results.services = data;

            //get diagnosis_opd
            return Emr.getDiagnosisOPD(db, hospcode, pid, seq);
          })
          .then((docs) => {
            results.diagnosis = docs;
            let icds = [];
            docs.forEach((v) => {
              icds.push(v.DIAGCODE);
            });

            return Diagnosis.getDiagList(db, icds);
          })
          .then((docs) => {
            let _diagnosis_code = docs;
            let _diagnosis = [];
            results.diagnosis.forEach((v) => {
              let obj = {};
              obj.diag_code = v.DIAGCODE;
              obj.diag_type = v.DIAGTYPE;
              let idx = _.findIndex(_diagnosis_code, {code: v.DIAGCODE});
              obj.diag_name = idx >= 0 ? _diagnosis_code[idx].name : '';
              _diagnosis.push(obj);
            });

            results.diagnosis = _diagnosis;
            return Emr.getProcedureOpd(db, hospcode, pid, seq);
          })
          .then((docs) => {

            let procedures_code = [];
            results.procedures = docs;

            docs.forEach((v) => {
              procedures_code.push(v.PROCEDCODE);
            });

            return Procedure.getList(db, procedures_code);

          })
          .then((docs) => {
            let _procedures = [];

            results.procedures.forEach((v) => {
              let obj = {};
              obj.proced_code = v.PROCEDCODE;
              obj.proced_price = v.SERVICEPRICE;
              let idx = _.findIndex(docs, {code: v.PROCEDCODE});
              obj.proced_name = idx >= 0 ? docs[idx].name : '';

              _procedures.push(obj);
            });

            results.procedures = _procedures;

            return Emr.getDrugOpd(db, hospcode, pid, seq);
          })
          .then((docs) => {
            let drugs = [];
            docs.forEach((v) => {
              let obj = {};
              obj.did = v.DIDSTD;
              obj.dname = v.DNAME;
              obj.amount = v.AMOUNT;
              obj.price = v.DRUGPRICE;
              obj.cost = v.DRUGCOST;
              obj.total = parseFloat(v.DRUGPRICE) * parseFloat(v.AMOUNT);
              drugs.push(obj);
            });

            results.drugs = drugs;

            return Emr.getLabFu(db, hospcode, pid, seq);

          })
          .then((docs) => {
            let lab_codes = [];
            results.labs = docs;

            docs.forEach((v) => {
              lab_codes.push(v.LABTEST);
            });

            return LabFu.getList(db, lab_codes);

          })
          .then((docs) => {
            let _labs = [];

            results.labs.forEach((v) => {
              let obj = {};
              obj.lab_code = v.LABTEST;
              obj.lab_result = v.LABRESULT;
              let idx = _.findIndex(docs, {code: v.LABTEST});
              obj.lab_name = idx >= 0 ? docs[idx].name : '';

              _labs.push(obj);
            });

            results.labs = _labs;

            res.send({ok: true, rows: results})

          }, (err) => {
            res.send({ok: false, msg: err});
          })
      }
    } else {
      res.send({ok: false, msg: 'Access denied!'});
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  });
});
// service list
router.post('/service_list', (req, res, next) => {
  var cid = req.body.cid;
  var db = req.db;
  var services = [];
  var hospitals = [];

  let _hospcode = req.body._hospcode;
  let _key = req.body._key;

  let __key = Auth.decrypt(_key);

  Auth.doAuth(db, _hospcode, __key)
  .then((success) => {
    if (success) {
      if (!cid) {
        res.send({
          ok: false,
          msg: 'CID Not found!'
        });
      } else {
        Emr.getHPID(db, cid)
          .then((hpid) => {
            if (hpid.length) {
              Emr.getServiceHistory(db, hpid)
                .then((docs) => {
                  services = docs;
                  docs.forEach((v) => {
                    hospitals.push(v.HOSPCODE);
                  });
                  return Hospitals.getHospitals(db, hospitals);
                })
                .then((__hospitals) => {
                  let __services = [];
                  services.forEach((v) => {
                    let obj = {};
                    obj.HOSPCODE = v.HOSPCODE;
                    obj.PID = v.PID;
                    let idxHOS = _.findIndex(__hospitals, {
                      hospcode: v.HOSPCODE
                    });
                    obj.HOSPNAME = idxHOS >= 0 ? __hospitals[idxHOS].hosptype + __hospitals[idxHOS].name : '';
                    obj.DATE_SERV = v.DATE_SERV;
                    obj.TIME_SERV = v.TIME_SERV;
                    obj.STR_TIME = v.STR_TIME;
                    obj.SEQ = v.SEQ;
                    __services.push(obj);
                  });
                  res.send({
                    ok: true,
                    rows: __services
                  });
                }, (err) => {
                  console.log(err);
                  res.send({
                    ok: false,
                    msg: err
                  });
                });
            } else {
              res.send({
                ok: false,
                msg: 'ไม่พบรายการ'
              });
            }
          });
      }
    } else {
      res.send({ok: false, msg: 'Access denied!'});
    }
  }, (err) => {
    res.send({ok: false, msg: err})
  });

});

module.exports = router;
