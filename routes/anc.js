"use strict";

var express = require('express');
var router = express.Router();

var moment = require('moment');
var _ = require('lodash');
var fse = require('fs-extra');
var rimraf = require('rimraf');
var Auth = require('../models/auth');

/* GET home page. */
router.get('/',(req, res, next) => {
  res.send({ok: true, msg: `Welcome to weCare Server`, server_time: new Date()});
});

module.exports = router;
