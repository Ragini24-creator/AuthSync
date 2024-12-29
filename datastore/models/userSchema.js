const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    unique: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    mobile: String,
    lockout: {
        type: Boolean,
        default: false
    },
    activeDevices: [String]
});

const Users = new mongoose.model("Users", userSchema);

module.exports = Users;
