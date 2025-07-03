const jwt    = require('jsonwebtoken');
const {secret} = require('../config');

module.exports = function(req, res, next) {
  let token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({
        success: false,
        message: 'No token provided'
    });
  }

  jwt.verify(token, secret, function(err, decoded) {
    if (err) {
      return res.json({
        success: false,
        message: 'Failed to authenticate token'
      });
    }

    req.decoded = decoded;
    next();
  });
};
