
"use strict";

let Q = require('q');

module.exports = {

  getSurveillanceList(db, start, end, villages) {
    let q = Q.defer();

    db('ovstdiag as o')
      .select('p.cid', 'p.pname', 'p.fname', 'p.lname', 'o.icd10 as diag_code', 'icd.name as diag_name',
      'o.hn', 'o.vstdate', 'o.vsttime', 'p.moopart', 'p.addrpart', 'ta.full_name as address_name', 'o.vn')
      .innerJoin('patient as p', 'p.hn', 'o.hn')
      .leftJoin('icd101 as icd', 'icd.code', 'o.icd10')
      .joinRaw('left join thaiaddress as ta on ta.addressid=concat(p.chwpart, p.amppart, p.tmbpart)')
      .whereBetween('o.vstdate', [start, end])
      .whereRaw('concat(p.chwpart, p.amppart, p.tmbpart, p.moopart) in (?)', [villages])
      .whereRaw('o.icd10 in (select icd10 from stdcode506)')
      .where('o.diagtype', '1')
      .orderByRaw('o.vstdate desc')
      .then((rows) => {
        q.resolve(rows);
      })
      .catch((err) => {
        console.log(err);
        q.reject(err);
      });

    return q.promise;
  },

  getLabor(db, start, end, villages) {
    let q = Q.defer();

    db('person_anc as pa')
    .select('p.pname', 'p.fname', 'p.lname', db.raw('year(now())-year(p.birthdate) as age'), 'pa.labor_icd10 AS diag_code',
      'icd. NAME AS diag_name', 'pa.labor_date', 'pa.preg_no', 'p.person_id')
    .innerJoin('person as p', 'p.person_id', 'pa.person_id')
    .leftJoin('person_address as pad', 'pad.person_id', 'p.person_id')
    .leftJoin('icd101 as icd', 'icd.code', 'pa.labor_icd10')
    .whereBetween('pa.labor_date', [start, end])
    .whereRaw('concat(pad.chwpart, pad.amppart, pad.tmbpart, IF(CHAR_LENGTH(pad.moopart) = 1, concat("0", pad.moopart), pad.moopart)) IN (?)', [villages])
    .orderByRaw('p.fname, p.lname desc')
    .then((rows) => {
      q.resolve(rows);
    })
    .catch((err) => {
      console.log(err);
      q.reject(err);
    });

    return q.promise;
  },

  geVillagetList(db, hospcode) {
    let q = Q.defer();
    db.collection('village')
      .find({
        HOSPCODE: hospcode
      }, { _id: 0, VID: 1 })
      .toArray((err, docs) => {
        if (err) {
          console.log(err);
          q.reject(err);
        } else {
          let villages = [];
          docs.forEach((v) => {
            villages.push(v.VID)
          });
          q.resolve(villages);
        }
      });

    return q.promise;
  },

  getSurveillanceDiag(db, vn) {
    let q = Q.defer();
    let sql = `
    select od.icd10, icd.name as icd_name, od.diagtype, dt.name as diagtype_name
    from ovstdiag as od
    left join icd101 as icd on icd.code=od.icd10
    left join diagtype as dt on dt.diagtype=od.diagtype
    where od.vn=?
    and left(od.icd10, 1) not in ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9")
    order by od.diagtype
    `;

    db.raw(sql, [vn])
    .then((rows) => {
      q.resolve(rows[0])
    })
    .catch((err) => {
      q.reject(err)
    });

    return q.promise;
  },

  getSurveillanceDrug(db, vn) {
    let q = Q.defer();
    let sql = `
    select d.name as drug_name, op.qty, concat(du.name1, " ", du.name2) as drug_usage
    from opitemrece as op
    left join drugitems as d on d.icode=op.icode
    left join drugusage as du on du.drugusage=op.drugusage
    where op.icode in (select icode from drugitems)
    and op.vn=?
    `;

    db.raw(sql, [vn])
    .then((rows) => {
      q.resolve(rows[0])
    })
    .catch((err) => {
      q.reject(err)
    });

    return q.promise;
  },

  getSurveillanceLab(db, vn) {
    let q = Q.defer();
    let sql = `
      select lo.lab_order_number, lo.lab_items_code, li.lab_items_name, lo.lab_order_result, lo.confirm
      from lab_head as lh
      left join lab_order as lo on lo.lab_order_number=lh.lab_order_number
      left join lab_items as li on li.lab_items_code=lo.lab_items_code
      where lh.vn=?
      and length(lo.lab_order_result) > 1
      and li.lab_items_name is not null
      order by lo.lab_order_number desc
    `;

    db.raw(sql, [vn])
    .then((rows) => {
      q.resolve(rows[0])
    })
    .catch((err) => {
      q.reject(err)
    });

    return q.promise;
  },
  getSurveillanceScreening(db, vn) {
    let q = Q.defer();
    let sql = `
    SELECT o.vstdate, o.vsttime, o.pttype, pt.name as pttype_name, o.pttypeno, o.spclty, sp.name as spclty_name,
    o.ovstist, ot.name as ovstist_name, dep.department,
    opd.vn, opd.bpd, opd.bps, opd.bw, opd.cc, opd.pulse, opd.temperature, opd.rr, opd.height
    from opdscreen as opd
    inner join ovst as o on o.vn=opd.vn
    left join pttype as pt on pt.pttype=o.pttype
    left join ovstist as ot on ot.ovstist=o.ovstist
    left join spclty as sp on sp.spclty=o.spclty
    left join kskdepartment as dep on dep.depcode=o.main_dep
    where opd.cc is not null
    and opd.vn=?
    `;

    db.raw(sql, [vn])
    .then((rows) => {
      q.resolve(rows[0])
    })
    .catch((err) => {
      q.reject(err)
    });

    return q.promise;
  },

  getLaborDetail(db, pid) {
    let q = Q.defer();
    let sql = `
    select pa.person_id, pa.labor_date, pa.preg_no, pa.lmp, pa.edc, pa.blood_hct_result, ifnull(pa.alive_child_count, 0) as lborn, ifnull(pa.dead_child_count, 0) as sborn,
    pa.current_preg_age, pa.labor_icd10 as diag_code, icd.name as diag_name, tr.thalassaemia_result_name, pa.has_risk, pa.first_doctor_date
    from person_anc as pa
    left join thalassaemia_result as tr on tr.thalassaemia_result_id=pa.thalassaemia_result_id
    left join icd101 as icd on icd.code=pa.labor_icd10
    where pa.person_id = ?
    `;

    db.raw(sql, [pid])
    .then((rows) => {
      q.resolve(rows[0])
    })
    .catch((err) => {
      q.reject(err)
    });

    return q.promise;
  }
};