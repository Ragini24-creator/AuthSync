const useragent = require('user-agent')
const Session = require("../datastore/models/sessionSchema.js");
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
        const { email, password, deviceId } = req.body;
        const hashedPassword = await passwordHashing(password);
        const unique = uuidv4();
        // const deviceId = uuidv4();

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
    const { email, password, deviceId } = req.body;
    console.log("from user controller line 59 fingerprint is : ", deviceId)
    //  check it in database
    const user = await Users.findOne({ email: email });
    console.log(user)
    if (!user) {
        return res.status(400).send(
            "User not found"
        )
    }

    // const agent = useragent.parse(req.headers["user-agent"]);
    // const deviceInfo = `${agent.os} - ${agent.browser}`;
    // const ipAddress = req.ip;




    const storedHashedPassword = user.password

    //  convert password to hash and verify its existence in database
    const isPasswordValid = await comparePassword(password, storedHashedPassword);
    let updatedUser;
    if (isPasswordValid) {
        const ssoToken = (generateJWT(user.unique, deviceId))   //user.activeDevices[0]
        console.log(ssoToken)

        setCookie(res, "authToken", ssoToken);

        if (!user.activeDevices.includes(deviceId)) {
            updatedUser = await Users.findOneAndUpdate(
                { unique: user.unique },
                { $push: { activeDevices: deviceId } },
                { new: true },
            );
        }

        // find the device and update its "status to active"
        //const deviceId = user.activeDevices[0];
        await Devices.findOneAndUpdate(
            { userid: user.unique, deviceid: deviceId },
            { $set: { status: "active" } },
            { new: true, upsert: true } // optional, but recommended
        );






        const qrUrl = await getQR(ssoToken)

        res.status(200).send({
            status: "Success",
            message: "Login successful, cookie has been set",
            email,
            qrUrl,
            userData: {
                userName: email.split('@')[0],
                email,
                loggedInDevices: updatedUser ? updatedUser.activeDevices.length : user.activeDevices.length,
                activeDevices: updatedUser ? updatedUser.activeDevices : user.activeDevices,
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
    if (!req.headers['cookie']) return res.status(401);
    console.log('from validateUserSession function logging cookie: ',)
    // let ssoToken = undefined;

    let cookieElements = req.headers['cookie'].split('=');
    let ssoToken = cookieElements[2];
    // if (req.headers['cookie']?.split('=')[0] === 'abuse_interstitial' && req.headers['cookie']?.split('=').length === 2) {
    //     return res.status(400)
    // }

    // if (req.headers['cookie']?.split('=')[1] === 'authToken') {
    //     ssoToken = req.headers['cookie']?.split('=')[1] === 'authToken'
    // }

    // else if (req.headers['cookie']?.split(';')[1].split('=')[0] === 'authToken') {
    //     ssoToken = req.headers['cookie']?.split(';')[1].split('=')[1];
    // }

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
                    loggedInDevices: user.activeDevices.length,
                    activeDevices: user.activeDevices
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
                    { $pull: { activeDevices: deviceId } },
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
                if (!user || user.primaryDevice != deviceId) {
                    return res.status(403).json({ message: "Unauthorized to trigger lockout" });
                }

                await Devices.updateMany(
                    { userid: user.unique, deviceid: { $ne: user.primaryDevice }, status: "active" },
                    { $set: { status: "signedout" } }
                );

                await Users.findOneAndUpdate(
                    { unique },
                    { $set: { activeDevices: [user.primaryDevice] } }
                );

                const userId = user.email.split('@')[0];
                sendEventToUser(userId, user.primaryDevice)
                // sendEventToUser(userId, user.primaryDevice)

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
    console.log('Inside manageSSEConnection, New Request Received ', req.params.userId)
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

// const manageSSEConnection = (req, res) => {
//     const userId = req.params.userId;
//     const deviceId = req.params.deviceId;

//     console.log('📥 SSE request received from:', userId, deviceId);

//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Connection", "keep-alive");

//     // Initialize user entry if not present
//     if (!clients[userId]) {
//         clients[userId] = {};
//     }

//     // Initialize device entry if not present
//     if (!clients[userId][deviceId]) {
//         clients[userId][deviceId] = [];
//     }

//     // Save the connection (res)
//     clients[userId][deviceId].push(res);

//     console.log(`📡 User ${userId} (Device ${deviceId}) connected for SSE`);

//     // Remove client on disconnect
//     req.on("close", () => {
//         clients[userId][deviceId] = clients[userId][deviceId].filter(client => client !== res);
//         console.log(`❌ User ${userId} (Device ${deviceId}) disconnected from SSE`);

//         // Clean up empty arrays
//         if (clients[userId][deviceId].length === 0) {
//             delete clients[userId][deviceId];
//         }

//         // Clean up empty users
//         if (Object.keys(clients[userId]).length === 0) {
//             delete clients[userId];
//         }
//     });
// };


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

function sendEventToUser(userId, primaryDeviceId) {
    if (clients[userId]) {
        console.log('from sendEventToUser function, clients object: ', clients[userId])
        clients[userId].forEach(client => {
            const eventData = `data: ${JSON.stringify({ action: "logout" })}\n\n`;
            console.log(`📤 Sending SSE data: ${eventData}`);
            client.write(eventData);
            client.flushHeaders?.(); // Ensures immediate send
            client.end(); // Close connection after sending (for testing)
        });
    }
}
// function sendEventToUser(userId, primaryDeviceId) {
//     if (clients[userId]) {
//         Object.entries(clients[userId]).forEach(([deviceId, clientList]) => {
//             if (deviceId !== primaryDeviceId) {
//                 clientList.forEach(client => {
//                     const eventData = `data: ${JSON.stringify({ action: "logout" })}\n\n`;
//                     console.log(`📤 Sending SSE logout to User ${userId}, Device ${deviceId}: ${eventData}`);
//                     client.write(eventData);
//                     client.flushHeaders?.(); // Optional, ensures data is sent immediately
//                     client.end(); // Optional: close after sending
//                 });
//             }
//         });
//     }
// }



// const getSessions = async (req, res) => {
//     const userId = req.user.userId;
//     const sessions = await Session.find({ userId });

//     res.json(
//         sessions.map((s) => ({
//             id: s._id,
//             deviceInfo: s.deviceInfo,
//             ipAddress: s.ipAddress,
//             loginTime: s.createdAt,
//         }))
//     );
// };

// FOR LOGOUT FROM SPECIFIC DEVICE

const deviceSSEClients = {};

const manageDeviceSSE = (req, res) => {
    const { userId, deviceId } = req.params;
    console.log(`🔌 New device SSE connection: user=${userId}, device=${deviceId}`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!deviceSSEClients[userId]) {
        deviceSSEClients[userId] = {};
    }

    // Save the device-specific connection
    deviceSSEClients[userId][deviceId] = res;

    // Handle disconnection
    req.on("close", () => {
        console.log(`❌ Device SSE disconnected: user=${userId}, device=${deviceId}`);
        delete deviceSSEClients[userId][deviceId];

        // Clean up empty user entry
        if (Object.keys(deviceSSEClients[userId]).length === 0) {
            delete deviceSSEClients[userId];
        }
    });
};


const sendEventToSpecificDevice = (userId, deviceId, data = { action: "logout" }) => {
    const client = deviceSSEClients[userId]?.[deviceId];
    if (client) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        console.log(`📤 Sending to user=${userId}, device=${deviceId} ➜`, payload);
        client.write(payload);
    } else {
        console.log(`⚠️ No client found for user=${userId}, device=${deviceId}`);
    }
};


const broadcastToAllUserDevices = (userId, data = { action: "logout" }) => {
    const userDevices = deviceSSEClients[userId];
    if (userDevices) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        Object.entries(userDevices).forEach(([deviceId, res]) => {
            console.log(`📡 Broadcasting to ${userId}:${deviceId}`);
            res.write(payload);
        });
    }
};



module.exports = {
    registerUser,
    loginUser,
    validateUserSession,
    logoutUser,
    emergencyLockout,
    manageSSEConnection,
    manageDeviceSSE,
    broadcastToAllUserDevices,
    sendEventToSpecificDevice

}