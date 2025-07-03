const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Ekos', new Schema({
    username: String,
    token: String,
    email: String,
    lastLogged: Date,
    connected: Boolean,
    bandwidth: Number,
    from_date: Date,
    to_date: Date,
    plan_id: String,
    machine_id: String,
    observatory_name: String,
    version: String,
}));
