const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { generateJWT, setCookie, jwtAuthenticationMiddleware } = require('./utils/jwt.js')


const connectDB = require('./datastore/connection.js');
const mongoose = require("mongoose");
const PASSWORD = encodeURIComponent(process.env.DATABASE_PASSWORD);

const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid')
const DB_URL = `mongodb+srv://Ragini:${PASSWORD}@cluster0.om43n.mongodb.net/AUTHSYNC?retryWrites=true&w=majority&appName=Cluster0`;
const app = express();


const QR = require('qrcode')
// importing  userModel

const transferSession = require("./datastore/models/transferSession.js")

app.use(express.json());

connectDB();

app.listen(9000, () => {
  console.log(`server is running on ${9000}`);
});

mongoose.connect(DB_URL).then((con) => {
  console.log(con.connections);
  console.log("DB connection successful!");
});


const checkExistingSessionToken = async function (decodedUnique) {
  const transferSessionObject = await transferSession.findOne({ unique: decodedUnique })
  if (transferSessionObject) {
    console.log("Existing session token found:", transferSessionObject);

    // check if session token is valid (not expired , not used)
    const isExpired = Date.now() > Date.now(transferSessionObject.expirationTime).getTime()
    const isUsed = transferSessionObject.flag === 'used';

    if (!isExpired && !isUsed) {
      console.log("Reusing existing session token....")
      return {
        status: true,
        sessionToken: transferSessionObject.sessionToken,
      };
    }
    console.log("Existing token is invalid.");
    return { status: false };

  }
  return { status: false };
}

app.get("/authSync/QR", jwtAuthenticationMiddleware, async (req, res) => {
  try {

    const { unique: decodedUnique, } = req.decodedValue

    if (!decodedUnique) {
      return res.status(400).send("Invalid or missing 'unique' value in JWT");
    }

    console.log("Decoded unique identifier:", decodedUnique);

    // checks if session token already exists under the decoded uuid 
    const existingToken = await checkExistingSessionToken(decodedUnique);

    if (existingToken.status) {
      console.log("Using existing session token")
    }

    // If no valid existing token, generate a new one
    const newSessionToken = await generateNewSessionToken(decodedUnique);

    res.status(200).json({
      message: "New session token generated",
      sessionToken: newSessionToken,

    })
  }
  catch (error) {
    res.send("Error generating session Token")
  }
})


async function generateNewSessionToken(unique) {
  try {
    const newSessionToken = uuidv4();
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await transferSession.create({
      unique, newSessionToken, expirationTime
    })

    console.log("New session token generated:", newSessionToken);

    const qrCodeDataUrl = await generateQR(unique, newSessionToken, expirationTime)
    console.log(qrCodeDataUrl)
    // Call the function to save the QR code as a file
    await saveQRCodeAsFile(qrCodeDataUrl, 'qr_code.png');
    return newSessionToken
  }
  catch (error) {
    console.log(error)
  }
}

const generateQR = async function (uuid, sessionToken, expirationTime) {
  try {
    const data = {
      uuid: uuid,
      token: sessionToken,
      expirationTime: expirationTime,
    }

    const jsonData = JSON.stringify(data);


    const qrCodeDataUrl = await qrcode.toDataURL(jsonData, {
      errorCorrectionLevel: 'H', // High error correction level
      width: 300,                 // Adjust the width
      margin: 2                   // Adjust the margin size
    });

    return qrCodeDataUrl;




  }
  catch (error) {
    console.log(error)
  }
}


// Save QR Code as file
const saveQRCodeAsFile = async function (qrCodeDataUrl, filename) {
  try {
    // Remove the data URL prefix (data:image/png;base64,)
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    // Write the base64 data to a file
    fs.writeFile(filename, base64Data, 'base64', (err) => {
      if (err) {
        console.error('Error saving QR code:', err);
      } else {
        console.log('QR code saved as', filename);
      }
    });
  } catch (error) {
    console.log('Error saving QR code as file:', error);
  }
};

