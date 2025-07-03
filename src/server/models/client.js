const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    username: String,
    password: { type: String, bcrypt: true},
    email: String,
    ip: String,
    lastLogged: {type: Date, default: Date.now },
});

clientSchema.plugin(require('mongoose-bcrypt'));

module.exports = mongoose.model('Client', clientSchema );
