const mongoose = require('mongoose');

// N.B. Only exists in online database
module.exports = mongoose.model('licenses', new mongoose.Schema({
    email: String,
    name: String,
    username: String,
    serial: String,
    license: String,
    client: String,
    ip: String,
    status: String,
    activations: {type:Number,default:0},
    lastActivation: Date,
}));
