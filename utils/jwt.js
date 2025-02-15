
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const jwt = require("jsonwebtoken");
const SecretKey = process.env.JWT_SECRET_KEY
const jwtExpiresIn = process.env.EXPIRES_IN



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


function jwtAuthenticationMiddleware(ssoToken) {
    // const token = req.headers['authorization']?.split(' ')[1];

    // if (!token) {
    //     res.sendStatus(403) // forbidden

    // }


    try {
        const decoded = jwt.verify(ssoToken, SecretKey)
        // req.decodedValue = decoded;
        return decoded
    } catch (error) {
        console.log("jwtAuthenticationMiddleware: Invalid or expired token ")
    }
}

module.exports = {
    generateJWT, setCookie, jwtAuthenticationMiddleware
}