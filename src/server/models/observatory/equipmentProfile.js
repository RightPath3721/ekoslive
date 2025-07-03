const mongoose = require('mongoose');

const equipmentProfileScheme = new mongoose.Schema({
    name: String,
    equipments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "EquipmentModel",
    }],
    isSynced: {
        type: Boolean,
        default: false
    }
});

equipmentProfileScheme.pre('deleteMany', async function (next)
{
    const profileIDs = this.getQuery()._id.$in;
    await Promise.all(profileIDs.map(async (id) =>
    {
        const profile = await this.model.db.model('EquipmentProfile').findById(id);
        await this.model.db.model('EquipmentModel').deleteMany({ _id: { $in: profile.equipments } });
    }));
    next();
});

module.exports = mongoose.model("EquipmentProfile", equipmentProfileScheme);
