const express = require('express');
const app = express();
const bodyParser = require("body-parser")
const Users = require("../datastore/models/userSchema.js");
const transferSession = require('../datastore/models/transferSession.js')
const generateQR = require('../utils/QRUtils.js')
const { checkExistingSessionToken, generateNewSessionToken } = require('../utils/sessionUtils.js')

app.use(express.json())

const getQR = async (req, res) => {
    try {

        const { unique: decodedUnique, } = req.decodedValue

        if (!decodedUnique) {
            return res.status(400).send("Invalid or missing 'unique' value in JWT");
        }

        console.log("Decoded unique identifier:", decodedUnique);

        // Check if the user exists in the User schema
        const user = await Users.findOne({ unique: decodedUnique });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // checks if session token already exists under the decoded uuid 
        const existingToken = await checkExistingSessionToken(decodedUnique);

        if (existingToken.status) {
            // If an existing session token is found, send it to the user
            console.log("Using existing session token");
            const qrURL = await generateQR(existingToken)
            return res.status(200).json({
                message: "QR generated",
                qr: qrURL
            })
        }

        // If no valid existing token, generate a new one
        const newSessionToken = await generateNewSessionToken(decodedUnique);

        // use the new session token to generate QR 
        const qrURL = await generateQR(newSessionToken)


        res.status(200).json({
            message: "New session token generated",
            sessionToken: newSessionToken,
            qr: qrURL
        })
    }
    catch (error) {
        res.send(error)
    }
}


const validateQR = async (req, res) => {
    console.log("request hit after QR scanning")
    const extractedSessionToken = req.body;  // Access token and user from the body

    // Step 1: Check if session token exists
    const session = await transferSession.findOne(extractedSessionToken); // Your DB query to check if token exists
    if (!session) {
        return res.status(400).send('Invalid session token');
    }

    // Step 2: Check if the session has expired
    const currentTime = new Date(); // Get current time

    if (session.expires_at <= currentTime) {
        return res.status(400).send('Session expired');
    }


    // Step 3: Continue with the session transfer process (e.g., OTP, etc.)
    res.send('Session is valid and ready for transfer');

}






module.exports = {
    getQR, validateQR
}