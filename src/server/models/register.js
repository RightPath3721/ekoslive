const mongoose = require('mongoose');

module.exports = mongoose.model('Register', new mongoose.Schema({
    username: String,
    serial: String,
    license: String,
    ip: String,
    deviceid: String,
    ts: {type: Date, default: Date.now },
}));
