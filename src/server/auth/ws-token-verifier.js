const jwt    = require('jsonwebtoken');

module.exports = function(token, secret) {
  try {
      jwt.verify(token, secret);
      return true;
  } catch (err)
  {
    console.log("jwt.verify error:" + err);
    return false;
  }
};
