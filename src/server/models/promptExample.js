const mongoose = require('mongoose');

module.exports = mongoose.model('PromptExample', new mongoose.Schema({
    prompt: { type: String, reqiured: true },
}, {
    versionKey: false,
    timestamps: false,
    collection: "promptExamples",
}));