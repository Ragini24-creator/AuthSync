import { useState, useEffect, useRef } from "react";
import QRScanner from "./QRScanner";
import SSE from "./SSE";
import { getDeviceFingerprint } from './utils/fingerprint'
import useDeviceSSE from "./useDeviceSSE";



const ScanPage = (props) => {
    const [qrResult, setQrResult] = useState(null);
    // const [email, setEmailId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    useDeviceSSE(userId, deviceId);
    // useEmergencySSE(userId, deviceId);


    const handleScan = async (data) => {
        setQrResult(data);
        console.log('scanned data', data)
        const fingerprint = await getDeviceFingerprint();
        console.log("Line 32 of loginform.js Device Fingerprint:", fingerprint);
        setDeviceId(fingerprint);
        // Send scanned data to backend
        const response = await fetch("/authSync/validateQR", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qrData: data, deviceId: fingerprint }),
        });

        const parsedData = await response.json();

        // if (parsedData.status !== 'Success') {
        //     console.log('Failed to Login User');
        //     return;
        // }
        console.log('from scanpage, login response: ', parsedData)
        SSE(parsedData.userData.userName);
        props.onSuccessfulLogin(true, parsedData);

        // setUserId(parsedData.userData.userName, fingerprint)
        // useDeviceSSE()

    }




    return (
        <div>
            <h2>Login via QR Code</h2>
            <QRScanner onScanSuccess={handleScan} />
            {qrResult && <p>Scanned Data: {qrResult}</p>}
        </div>
    );
};

export default ScanPage;
