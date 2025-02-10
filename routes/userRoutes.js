const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const { validateUserInput } = require('../middleware/validation.js')

const router = express.Router();

try {
    router.post('/register', validateUserInput, registerUser)

    router.post('/login', validateUserInput, loginUser)
} catch (error) {
    console.log(error)
    process.exit(0)
}


module.exports = router;