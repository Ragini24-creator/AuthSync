const mongoose = require('mongoose');

const transferSessionSchema = new mongoose.Schema({
    unique: {
        type: String, // Referencing the ObjectId type
        ref: "User", // The name of the users schema model
        required: true
    },
    sessionToken: {
        type: String,
    },
    expirationTime: {
        type: Date,
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    }
})

const transferSession = new mongoose.model("transferSession", transferSessionSchema);

module.exports = transferSession;