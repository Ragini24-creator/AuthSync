const express = require('express');
const { registerUser, loginUser, validateUserSession, logoutUser, emergencyLockout, manageSSEConnection } = require('../controllers/userController');
const { validateUserInput } = require('../middleware/validation.js')

const router = express.Router();

try {
    router.post('/emergencyLockout', emergencyLockout)
    router.get('/session/validate', validateUserSession)
    router.get('/logout', logoutUser)
    router.post('/signup', validateUserInput, registerUser)
    router.post('/login', validateUserInput, loginUser)
    router.get('/events/:userId', manageSSEConnection)
} catch (error) {
    console.log(error)
    process.exit(0)
}


module.exports = router;