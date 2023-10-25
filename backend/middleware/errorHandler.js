const app = require('express');
const fsPromises = require('fs').promises;
const path = require('path');

const { logEvents } = require('./logger');

const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}\t${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    'errLog.log'
  );
  console.log(err.stack);

  const status = res.statusCode ? status : 500; //server code

  res.status(status);

  res.json({ message: err.message });

  next();
};

module.exports = errorHandler;
