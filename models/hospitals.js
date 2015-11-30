var Q = require('q');

module.exports = {
  getHospitals: function(db, hospitals) {
    var q = Q.defer();

    db.collection('hospitals').find({
      hospcode: {
        $in: hospitals
      }
    }).toArray(function(err, hos) {
      if (err) {
        q.reject(err);
      } else {
        q.resolve(hos);
      }
    });

    return q.promise;

  }
}
