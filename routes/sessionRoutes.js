const express = require('express')
const { getQR, validateQR } = require('../controllers/sessionController')
const { jwtAuthenticationMiddleware } = require('../utils/jwt')

// const {getQR} = require('../controllers/sessionController.js')



const router = express.Router();

router.get('/QR', jwtAuthenticationMiddleware, getQR)
router.post('/validateQR', validateQR)

module.exports = router;