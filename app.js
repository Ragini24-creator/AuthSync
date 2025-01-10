const express = require("express");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
dotenv.config({ path: "./config.env" });
const connectDB = require('./datastore/connection.js');
const mongoose = require("mongoose");
const PASSWORD = encodeURIComponent(process.env.DATABASE_PASSWORD);
const SecretKey = process.env.JWT_SECRET_KEY
const jwtExpiresIn = process.env.EXPIRES_IN
const { v4: uuidv4 } = require('uuid')
const DB_URL = `mongodb+srv://Ragini:${PASSWORD}@cluster0.om43n.mongodb.net/AUTHSYNC?retryWrites=true&w=majority&appName=Cluster0`;
const app = express();


const QR = require('qrcode')
// importing  userModel
const Users = require("./datastore/models/userSchema.js");
const Devices = require("./datastore/models/deviceSchema.js")
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

const validateUserInput = (req, res, next) => {

  const { email, password } = req.body
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Email format is invalid" });
  }

  if (!password || password.length < 8) {
    return res.status(400).send("password must be of atleast  8 characters ");
  }

  next();
};

// Register endpoint
app.post("/authSync/register", validateUserInput, async (req, res) => {

  try {
    const { email, password } = req.body;
    const hashedPassword = await passwordHashing(password);
    const unique = uuidv4();
    const deviceId = uuidv4();
    const user = await Users.findOne({ email: email });
    const device = await Devices.findOne({ deviceId })
    if (!user) {
      const newUser = await Users.create({
        unique, email, password: hashedPassword, activeDevices: [deviceId]
      })

      if (!device) {
        await Devices.create({
          userid: unique,
          deviceid: deviceId
        })
      }

      res.status(201).json({
        status: "user registered successfully",
        user: newUser
      });
    }
    else {
      throw new Error("User already exists")
    }
  }
  catch (error) {
    console.error(error)
    if (error instanceof Error) {
      res.status(400).send({ status: "Failed to create user", message: error.message })
    }
  }

});

// login endpoint
app.post("/authSync/login", validateUserInput, async (req, res) => {

  const { email, password } = req.body;

  //  check it in database
  const user = await Users.findOne({ email: email });
  console.log(user)
  if (!user) {
    return res.status(400).send(
      "User not found"
    )
  }

  // find the device and update its "status to active"
  const deviceId = user.activeDevices[0];
  await Devices.findOneAndUpdate({ deviceid: deviceId, status: "active" });


  const storedHashedPassword = user.password

  //  convert password to hash and verify its existence in database
  const isPasswordValid = await comparePassword(password, storedHashedPassword);
  if (isPasswordValid) {
    const ssoToken = (generateJWT(user.unique, user.activeDevices[0]))
    console.log(ssoToken)

    setCookie(res, "authToken", ssoToken);

    res.status(200).send({
      status: "success",
      message: "Login successful, cookie has been set"
    })
  } else {
    res.status(400).json({
      message: "Invalid credentials",
    });
  }
});

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


// const payload:{uuid, deviceid}
const generateJWT = function (unique, deviceId) {
  const token = jwt.sign({ unique, deviceId }, SecretKey, { expiresIn: jwtExpiresIn })
  return token;
}

//set cookie
const setCookie = function (res, name, token) {
  res.cookie(name, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
  }
  )
}


function jwtAuthenticationMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.sendStatus(403) // forbidden

  }


  try {
    const decoded = jwt.verify(token, SecretKey)
    req.decodedValue = decoded;
    next();
  } catch (error) {
    return res.send("Invalid or expired token ")
  }
}

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
      sessionToken: newSessionToken
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
    return newSessionToken;
  }
  catch (error) {
    console.log(error)
  }
}

