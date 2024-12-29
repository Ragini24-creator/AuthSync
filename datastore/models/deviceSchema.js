const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    userid: String,
    deviceid: String,
    status: {
        type: String,
        enum: ['active', 'signedout'],
        default: 'signedout',
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
})

const Devices = new mongoose.model(" Devices", deviceSchema);

module.exports = Devices;
