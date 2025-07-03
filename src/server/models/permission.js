const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    allow: { type: Boolean, default: true },
    role: [String],
    subject: String,
    actions: Array,
    conditions: Object,
    userActions: [Object],
});

module.exports = mongoose.model('Permission', permissionSchema);
