const express = require('express');
const app = express();
const bodyParser = require("body-parser")
const Devices = require('../datastore/models/deviceSchema.js')
const Users = require("../datastore/models/userSchema.js");
const transferSession = require('../datastore/models/transferSession.js')
const generateQR = require('../utils/QRUtils.js')
const { checkExistingSessionToken, generateNewSessionToken } = require('../utils/sessionUtils.js')
const { generateJWT, setCookie } = require('../utils/jwt.js')
const SecretKey = process.env.JWT_SECRET_KEY
const jwt = require('jsonwebtoken');
const uuid = require('uuid')

app.use(express.json())

const getQR = async (ssoToken) => {
    try {
        if (!ssoToken) {
            throw new Error('ssoToken is mandatory!')
        }

        const decoded = jwt.verify(ssoToken, SecretKey)
        const { unique: decodedUnique, } = decoded;

        if (!decodedUnique) {
            throw new Error('Invalid or missing Unique field in ssoToken')
            // return res.status(400).send("Invalid or missing 'unique' value in JWT");
        }

        console.log("Decoded unique identifier:", decodedUnique);

        // Check if the user exists in the User schema
        const user = await Users.findOne({ unique: decodedUnique });
        if (!user) {
            throw new Error('user not found');
            // return res.status(404).json({ message: "User not found" });
        }

        // checks if session token already exists under the decoded uuid 
        // const existingToken = await checkExistingSessionToken(decodedUnique);

        // if (existingToken.status) {
        // If an existing session token is found, send it to the user
        //     console.log("Using existing session token");
        //     const qrURL = await generateQR(existingToken)
        //     return res.status(200).json({
        //         message: "QR generated",
        //         qr: qrURL
        //     })
        // }

        // If no valid existing token, generate a new one
        //const newSessionToken = await generateNewSessionToken(decodedUnique);

        // use the new session token to generate QR 
        console.log(user.unique)
        const qrURL = await generateQR(user.unique)

        return qrURL
        // console.log('qr generated', qrURL)
        // res.status(200).json({
        //     message: "New session token generated",
        //     qr: qrURL
        // })
    }
    catch (error) {
        console.log('from getQr', error)
        // res.send(error)
    }
}


const validateQR = async (req, res) => {
    try {
        console.log("request hit after QR scanning", req.body)
        const { qrData: unique } = req.body;  // Access token and user from the body


        // Step 1: Check if user exists
        const user = await Users.findOne({ unique }); // Your DB query to check if token exists
        if (!user) {
            return res.status(400).send('Invalid session token');
        }

        const deviceID = uuid.v4();
        await Users.findOneAndUpdate({ unique }, { $push: { activedevices: deviceID } })
        await Devices.create({
            userid: unique, deviceid: deviceID, status: "active"
        })
        // Step 2: Check if the session has expired
        //const currentTime = new Date(); // Get current time

        // if (session.expires_at <= currentTime) {
        //     return res.status(400).send('Session expired');
        // }
        const ssoToken = generateJWT(unique, deviceID)

        setCookie(res, "authToken", ssoToken)

        // Step 3: Continue with the session transfer process (e.g., OTP, etc.)

        const qrUrl = await getQR(ssoToken)

        res.status(200).send({
            status: "success",
            message: "Login successful, cookie has been set",
            userData: {
                userName: user.email.split('@')[0],
                email: user.email
            },
            qrUrl
        })
    } catch (error) {
        console.log("Error occured in validate QR function: ", error.message)
    }

}






module.exports = {
    getQR, validateQR
}