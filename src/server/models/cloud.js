const mongoose = require('mongoose');

module.exports =  mongoose.model('Cloud', new mongoose.Schema({
    username: String,
    token: String,
    email: String,
    lastLogged: Date,
    connected: Boolean,
    storage: Number,
    primaryID: String,
    from_date: Date,
    to_date: Date,
    plan_id: String,
    metadatas: Array,
    previews: Array,
    thumbnails: Array,
    tags: Array,
    sequences: Array,
    schedules: Array,
}));
