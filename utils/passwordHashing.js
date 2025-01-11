const bcrypt = require("bcryptjs");


const passwordHashing = async function (password) {
    try {
        const saltRounds = 11;
        hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error(error);
    }
};

const comparePassword = async function (password, hashedPassword) {
    try {
        const isValid = await bcrypt.compare(password, hashedPassword);
        return isValid;
    } catch (error) {
        console.error(error);
    }
};

module.exports = {
    passwordHashing,
    comparePassword
}