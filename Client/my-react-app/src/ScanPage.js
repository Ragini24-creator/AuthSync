import { useState } from "react";
import QRScanner from "./QRScanner";

const ScanPage = (props) => {
    const [qrResult, setQrResult] = useState(null);

    const handleScan = async (data) => {
        setQrResult(data);
        console.log('scanned data', data)
        // Send scanned data to backend
        const response = await fetch("/authSync/validateQR", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qrData: data }),
        });

        const parsedData = await response.json();
        props.onSuccessfulLogin(true, parsedData);
    };

    return (
        <div>
            <h2>Login via QR Code</h2>
            <QRScanner onScanSuccess={handleScan} />
            {qrResult && <p>Scanned Data: {qrResult}</p>}
        </div>
    );
};

export default ScanPage;
