
import QRCode from "./QRcode"
import { socket } from './loginform.js'



export default function UserProfile(props) {
    const handleClick = async () => {
        const response = await fetch(`/authSync/logout`, {
            method: 'GET',
            credentials: "include"
        });

        const logoutResponse = await response.json();
        console.log(logoutResponse)
        if (logoutResponse.status === 'Success') {
            props.onSuccessfulLogout(true)


        }
    }
    const userId = props.data.userData.userName
    const handleEmergencyLockout = async () => {
        await fetch("/authSync/emergencyLockout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });


    };

    return (
        <div className="userprofile-container">
            <div className="nav-div">
                <img src='/userprofile.avif' width="100px" height="100px" />
                <div className="user-name-email-div">
                    <h2>{props.data.userData.userName}</h2>
                    <p>{props.data.userData.email}</p>
                </div>
                <button className="btn btn-logout" onClick={handleClick}>Logout</button>
            </div>
            <div className="features-div">
                <div className="active-session">
                    <h3>Active Sessions</h3>
                    <p>Number of devices logged in : {props.data.userData.loggedInDevices}</p>
                </div>
                <div className="emergency-lockout">
                    <h3>Emergency Lockout</h3>
                    <p>Use this option to immediately logout from all devices.This is useful if you suspect unauthorized access to account.</p>
                    <button className="btn btn-emergency-lockout" onClick={handleEmergencyLockout}>Emergency Lockout </button>
                </div>
                <div className="generate-QR">
                    <h3 className="qr-title">Your QR Code </h3>
                    {/* <p>Generate a QR code to quickly log in from another device</p> */}
                    {/* <button className="btn btn-generate-QR">Generate QR</button> */}
                    {props.data.qrUrl && <QRCode qrUrl={props.data.qrUrl} />}
                </div>
                <div className="remote-device-logout">
                    <h3>Remote Device Logout</h3>
                    <p>Use this to log out from specific devices in real time.</p>

                    {/* {activeDevices && Object.keys(activeDevices).length > 0 ? (
                        Object.keys(activeDevices).map((deviceId) => (
                            <div key={deviceId} className="device-item">
                                <span className={`device-id ${deviceId === currentDeviceId ? "current-device" : ""}`}>
                                    {deviceId === currentDeviceId ? `${deviceId} (This Device)` : deviceId}
                                </span>
                                {deviceId !== currentDeviceId && (
                                    <button className="btn btn-device-logout" onClick={() => handleLogoutDevice(deviceId)}>
                                        Logout 🔒
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No active devices found.</p>
                    )} */}
                </div>

            </div>
        </div>
    )
}