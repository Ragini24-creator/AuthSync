const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const { validateUserInput } = require('../middleware/validation.js')

const router = express.Router();

router.post('/authSync/register', validateUserInput, registerUser)

router.post('authSync/login', validateUserInput, loginUser)

module.exports = router;