const mongoose =require('mongoose');
const Schema = mongoose.Schema;

const CounterSchema = require('./counter');

const LinkSchema = new Schema({
    _id: { type: Number },
    url: { type: String, required: true }
}, {
    timestamps: true,
    collection: 'links'
});

LinkSchema.pre('save', function(next){
    const link = this;
    CounterSchema.findByIdAndUpdate('linkEntryCount',{ $inc: { count: 1 } }, { new: true, upsert: true })
    .then((counter) => 
    {
        link._id = counter.count;
        next();
    }).catch((err) => 
    {
        return next(err);
    })
});

module.exports = mongoose.model('LinkModel', LinkSchema);
