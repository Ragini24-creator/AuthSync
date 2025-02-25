const Users = require("../datastore/models/userSchema.js");
const Devices = require("../datastore/models/deviceSchema.js")
const { v4: uuidv4 } = require('uuid')
const { getQR } = require('./sessionController.js')
const { passwordHashing, comparePassword } = require('../utils/passwordHashing.js')
const { generateJWT, setCookie, jwtAuthenticationMiddleware } = require('../utils/jwt.js');


let clients = {};

// Register endpoint
const registerUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const hashedPassword = await passwordHashing(password);
        const unique = uuidv4();
        const deviceId = uuidv4();
        const user = await Users.findOne({ email: email });
        const device = await Devices.findOne({ deviceId })
        if (!user) {
            const newUser = await Users.create({
                unique, email, password: hashedPassword, activeDevices: [deviceId], primaryDevice: deviceId
            })

            if (!device) {
                await Devices.create({
                    userid: unique,
                    deviceid: deviceId
                })
            }

            res.status(201).json({
                status: "Success",
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

};



// login endpoint
const loginUser = async (req, res) => {
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
    await Devices.findOneAndUpdate({ deviceid: deviceId }, { $set: { status: "active" } });


    const storedHashedPassword = user.password

    //  convert password to hash and verify its existence in database
    const isPasswordValid = await comparePassword(password, storedHashedPassword);
    if (isPasswordValid) {
        const ssoToken = (generateJWT(user.unique, user.activeDevices[0]))
        console.log(ssoToken)

        setCookie(res, "authToken", ssoToken);

        const qrUrl = await getQR(ssoToken)

        res.status(200).send({
            status: "Success",
            message: "Login successful, cookie has been set",
            email,
            qrUrl,
            userData: {
                userName: email.split('@')[0],
                email,
                loggedInDevices: user.activeDevices.length
            }
        })
    } else {
        res.status(400).json({
            message: "Invalid credentials",
        });
    }
};

const validateUserSession = async (req, res) => {
    // const ssoToken = req.headers['cookie']?.split('=')[1];
    console.log(req.headers['cookie'])
    let ssoToken = undefined;

    if (req.headers['cookie']?.split('=')[0] === 'abuse_interstitial' && req.headers['cookie']?.split('=').length === 2) {
        return res.status(400)
    }

    if (req.headers['cookie']?.split('=')[1] === 'authToken') {
        ssoToken = req.headers['cookie']?.split('=')[1] === 'authToken'
    }

    else if (req.headers['cookie']?.split(';')[1].split('=')[0] === 'authToken') {
        ssoToken = req.headers['cookie']?.split(';')[1].split('=')[1];
    }

    if (!ssoToken) {
        return res.status(401).send({ status: "Failed" })
    }

    console.log(req.headers)
    if (!ssoToken) {
        console.log("from validate user session: no token")
        return res.status(401).json({
            status: "false",
            message: "Unauthorized: ssoToken is missing or invalid"
        })
    }
    else {
        console.log("from validate user session ", ssoToken);
        const decoded = jwtAuthenticationMiddleware(ssoToken)

        if (decoded) {
            const { unique, deviceId } = decoded;
            const qrUrl = await getQR(ssoToken)
            const user = await Users.findOne({ unique: unique });
            const device = await Devices.findOne({ userid: unique, deviceid: deviceId });

            if (device && device.status === 'signedout') {
                res.clearCookie("authToken", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict"
                });

                return res.status(401).json({
                    status: "Failed",
                    message: "Invalid user Session"
                })
            }

            return res.status(200).send({
                status: "success",
                qrUrl,
                userData: {
                    userName: user.email.split('@')[0],
                    email: user.email,
                    loggedInDevices: user.activeDevices.length
                }
            })
        }
        else {
            return res.status(401).send({
                status: "failed",
                message: "sso-token is invalid or expired!"
            })
        }

    }

}

const logoutUser = async (req, res) => {

    try {
        // for normal request from browser
        // const ssoToken = req.headers['cookie']?.split('=')[1];

        // for request from ngrok - cookie contains - abuse_interstitial=97c9-103-87-29-162.ngrok-free.app; authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWUiOiIwMjgxY2U4My0zM
        const ssoToken = req.headers['cookie']?.split(';')[1].split('=')[1];

        console.log('cookie from logout request', req.headers['cookie'], ssoToken)

        if (!ssoToken) {
            console.log('logoutUser: No ssoToken')
        }
        else {
            const decoded = jwtAuthenticationMiddleware(ssoToken)

            if (decoded) {
                const { unique, deviceId } = decoded;

                await Users.findOneAndUpdate(
                    { unique },
                    { $pull: { activedevices: deviceId } },
                );

                await Devices.updateOne(
                    { userid: unique, deviceid: deviceId, status: 'active' },
                    { $set: { status: 'signedout' } }
                )

                res.clearCookie("authToken", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict"
                });
                console.log('logout invoked')
                // sendEventToUser(userId)
                res.status(200).send({
                    status: "Success"
                })
            }

        }
    } catch (error) {
        res.send({
            status: "Failed",
            error: error.message
        })
    }


}

const emergencyLockout = async (req, res) => {
    try {
        const ssoToken = req.headers['cookie'].split(";")[1].split("=")[1]
        // const ssoToken = req.headers['cookie']?.split('=')[1];
        if (!ssoToken) {
            console.log("from Emergency Lockout : No ssoToken ")
        }


        else {
            console.log("sso", ssoToken)
            const decoded = jwtAuthenticationMiddleware(ssoToken)
            if (decoded) {
                const { unique, deviceId } = decoded

                const user = await Users.findOne({ unique: unique });
                if (!user || user.primaryDevice !== deviceId) {
                    return res.status(403).json({ message: "Unauthorized to trigger lockout" });
                }

                await Devices.updateMany(
                    { userid: user.unique, deviceid: { $ne: user.primaryDevice }, status: "active" },
                    { $set: { status: "signedout" } }
                );

                const userId = user.email.split('@')[0];
                sendEventToUser(userId)

                return res.json({ message: "Emergency lockout successful" });

            } else {
                res.send(400)
            }

        }
    }
    catch (error) {
        console.log('error occured in emergency lockout', error.message);
    }


};


const manageSSEConnection = (req, res) => {
    const userId = req.params.userId;
    console.log('SSE request received', req.params.userId)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!clients[userId]) {
        clients[userId] = [];
    }
    clients[userId].push(res);

    console.log(`📡 User ${userId} connected for SSE`);

    req.on("close", () => {
        clients[userId] = clients[userId].filter(client => client !== res);
        console.log(`❌ User ${userId} disconnected from SSE`);
    });
}

// Function to send event to all devices of a user
// function sendEventToUser(userId) {
//     if (clients[userId]) {
//         clients[userId].forEach(client => {
//             client.write(`data: ${JSON.stringify({ action: "logout" })}\n\n`);
//         });
//     }
//     console.log(`🚨 Logout event sent to user ${userId}`);
// }

// function sendEventToUser(userId) {

//     if (clients[userId]) {
//         clients[userId].forEach(client => {
//             const eventData = `data: ${JSON.stringify({ action: "logout" })}\n\n`;
//             console.log(`📤 Sending SSE data: ${eventData}`);
//             client.write(eventData);  // Send event properly
//         });
//     }
// }

function sendEventToUser(userId) {
    if (clients[userId]) {
        clients[userId].forEach(client => {
            const eventData = `data: ${JSON.stringify({ action: "logout" })}\n\n`;
            console.log(`📤 Sending SSE data: ${eventData}`);
            client.write(eventData);
            client.flushHeaders?.(); // Ensures immediate send
            client.end(); // Close connection after sending (for testing)
        });
    }
}



module.exports = {
    registerUser,
    loginUser,
    validateUserSession,
    logoutUser,
    emergencyLockout,
    manageSSEConnection
}