const Users = require("../datastore/models/userSchema.js");
const Devices = require("../datastore/models/deviceSchema.js")
const { v4: uuidv4 } = require('uuid')
const { getQR } = require('./sessionController.js')
const {
    passwordHashing, comparePassword } = require('../utils/passwordHashing.js')

const { generateJWT, setCookie, jwtAuthenticationMiddleware } = require('../utils/jwt.js');
const generateQR = require("../utils/QRUtils.js");


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
    await Devices.findOneAndUpdate({ deviceid: deviceId, status: "active" });


    const storedHashedPassword = user.password

    //  convert password to hash and verify its existence in database
    const isPasswordValid = await comparePassword(password, storedHashedPassword);
    if (isPasswordValid) {
        const ssoToken = (generateJWT(user.unique, user.activeDevices[0]))
        console.log(ssoToken)

        setCookie(res, "authToken", ssoToken);

        const qrUrl = await getQR(ssoToken)

        res.status(200).send({
            status: "success",
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
    const ssoToken = req.headers['cookie']?.split('=')[1];
    console.log(req.headers)
    if (!ssoToken) {
        console.log("from validate user session: no token")
        res.status(401).json({
            status: "false",
            message: "Unauthorized: ssoToken is missing or invalid"
        })
    }
    else {
        console.log("from validate user session ", ssoToken);
        const { unique } = jwtAuthenticationMiddleware(ssoToken)


        const user = await Users.findOne({ unique: unique });

        res.status(200).send({
            status: "success",
            userData: {
                userName: user.email.split('@')[0],
                email: user.email,
                loggedInDevices: user.activeDevices.length
            }
        })

    }

}

const logoutUser = async (req, res) => {

    try {
        const ssoToken = req.headers['cookie']?.split('=')[1];

        if (!ssoToken) {
            console.log('logoutUser: No ssoToken')
        }
        else {
            const { unique, deviceId } = jwtAuthenticationMiddleware(ssoToken)

            await Users.findOneAndUpdate(
                { unique },
                { $pull: { activedevices: deviceId } },
            );

            res.clearCookie("authToken", {
                httpOnly: true,
                secure: true,
                sameSite: "strict"
            });

            res.status(200).send({
                status: "Success"
            })
        }
    } catch (error) {
        res.send({
            status: "Failed",
            error: error.message
        })
    }


}



module.exports = {
    registerUser,
    loginUser,
    validateUserSession,
    logoutUser
}