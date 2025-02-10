const transferSession = require("../datastore/models/transferSession.js");
const generateQR = require('./QRUtils.js')
const { v4: uuidv4 } = require('uuid')

const checkExistingSessionToken = async function (decodedUnique) {
    const transferSessionObject = await transferSession.findOne({ unique: decodedUnique })
    if (transferSessionObject) {
        console.log("Existing session token found:", transferSessionObject);

        // check if session token is valid (not expired , not used)
        const isExpired = Date.now() > new Date(transferSessionObject.expirationTime).getTime()
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



async function generateNewSessionToken(unique) {
    try {
        // const newSessionToken = uuidv4();
        const expirationTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        //newSessionToken
        await transferSession.create({
            unique, expirationTime
        })

        // console.log("New session token generated:", newSessionToken);

        const qrCodeDataUrl = await generateQR(unique)
        // const qrCodeDataUrl = await generateQR(newSessionToken)
        console.log(qrCodeDataUrl)


        return newSessionToken
    }
    catch (error) {
        console.log(error)
    }
}

module.exports = { checkExistingSessionToken, generateNewSessionToken }