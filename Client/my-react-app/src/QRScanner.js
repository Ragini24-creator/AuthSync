import { Html5QrcodeScanner } from "html5-qrcode";
import { useState } from "react";

const QRScanner = ({ onScanSuccess }) => {
    const [isScanning, setIsScanning] = useState(false);

    const startScanning = () => {
        const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });

        scanner.render(
            (decodedText) => {
                onScanSuccess(decodedText);
                scanner.clear(); // Stop scanning automatically
                setIsScanning(false);
            },
            (error) => console.log(error)
        );

        setIsScanning(true);
    };

    return (
        <div>
            {!isScanning && (
                <button onClick={startScanning}>Scan QR to Login</button>
            )}
            <div id="reader"></div>
        </div>
    );
};

export default QRScanner;
