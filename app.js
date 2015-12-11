var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

var routes = require('./routes/index');
var users = require('./routes/users');
var emr = require('./routes/emr');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var uri = 'mongodb://localhost:27017/khdc';
var key = 'mANiNThEdARk';

var expressMongoDb = require('express-mongo-db');
app.use(expressMongoDb(uri));

app.use('/', routes);
app.use('/emr', emr);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  if (req.xhr) {
    res.send({ok: false, msg: err.message});
  } else {
    res.render('error', {
      message: err.message,
      error: {}
    });
  }
});


module.exports = app;
