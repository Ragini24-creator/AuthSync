const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    deviceInfo: { type: String, required: true },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;

