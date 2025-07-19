const qrcode = require('qrcode');

const generateQR = async function (unique) {
    try {
        // const data = {

        //     token: sessionToken
        //     // uuid: uuid,
        //     // expirationTime: expirationTime,
        // }

        const options = {
            errorCorrectionLevel: 'H', // High error correction level
            width: 300,                 // Adjust the width of the QR code
            margin: 2,          // Adjust the margin size around the QR code
            color: {
                dark: '#000',
                light: '#fff'
            }
        }

        // const jsonData = JSON.stringify(data);


        const qrCodeDataUrl = await qrcode.toDataURL(unique, options);

        // Now you can return qrCodeDataUrl to another function
        return qrCodeDataUrl;

        // const qrCodeDataUrl = await qrcode.toDataURL(jsonData, {
        //     errorCorrectionLevel: 'H', // High error correction level
        //     width: 300,                 // Adjust the width
        //     margin: 2                   // Adjust the margin size
        // });



    }
    catch (error) {
        console.log(error)
    }
}



module.exports = generateQR;