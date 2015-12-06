"use strict";

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var emr = require('./routes/emr');
var dashboard = require('./routes/dashboard');

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

var dbMySQL = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    database: 'hos',
    user: 'sa',
    password: 'sa'
  }
});

var expressMongoDb = require('express-mongo-db');
app.use(expressMongoDb(uri));

app.use((req, res, next) => {
  req.dbMySQL = dbMySQL;
  next();
});

app.use('/', routes);
app.use('/emr', emr);
app.use('/dashboard', dashboard);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({ok: false, msg: err.message});
});

module.exports = app;
