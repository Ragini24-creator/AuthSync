
import QRCode from "./QRcode"

export default function UserProfile(props) {
    const handleClick = async () => {
        const response = await fetch(`/authSync/logout`, {
            method: 'GET',
            credentials: "include"
        });

        const logoutResponse = await response.json();
        console.log(logoutResponse)
        if (logoutResponse.status === 'Success') {
            props.onSuccessfulLogout(false)
        }
    }


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
                    <button className="btn btn-emergency-lockout">Emergency Lockout </button>
                </div>
                <div className="generate-QR">
                    <h3 className="qr-title">Your QR Code </h3>
                    {/* <p>Generate a QR code to quickly log in from another device</p> */}
                    {/* <button className="btn btn-generate-QR">Generate QR</button> */}
                    {props.data.qrUrl && <QRCode qrUrl={props.data.qrUrl} />}
                </div>
            </div>
        </div>
    )
}