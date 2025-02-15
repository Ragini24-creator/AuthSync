const express = require('express');
const { registerUser, loginUser, validateUserSession, logoutUser } = require('../controllers/userController');
const { validateUserInput } = require('../middleware/validation.js')

const router = express.Router();

try {
    router.get('/session/validate', validateUserSession)
    router.get('/logout', logoutUser)
    router.post('/register', validateUserInput, registerUser)
    router.post('/login', validateUserInput, loginUser)

} catch (error) {
    console.log(error)
    process.exit(0)
}


module.exports = router;