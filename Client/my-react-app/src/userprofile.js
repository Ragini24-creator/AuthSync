

export default function UserProfile() {
    return (
        <div className="userprofile-container">
            <div className="nav-div">
                <img src='/userprofile.avif' width="100px" height="100px" />
                <div className="user-name-email-div">
                    <h2>Alexandra Johnson</h2>
                    <p>alexandra.j@example.com</p>
                </div>
                <button className="btn btn-logout">Logout</button>
            </div>
            <div className="features-div">
                <div className="active-session">
                    <h3>Active Sessions</h3>
                    <p>Number of devices logged in : 3</p>
                </div>
                <div className="emergency-lockout">
                    <h3>Emergency Lockout</h3>
                    <p>Use this option to immediately logout from all devices.This is useful if you suspect unauthorized access to account.</p>
                    <button className="btn btn-emergency-lockout">Emergency Lockout </button>
                </div>
                <div className="generate-QR">
                    <h3>Generate QR code</h3>
                    <p>Generate a QR code to quickly log in from another device</p>
                    <button className="btn btn-generate-QR">Generate QR</button>
                </div>
            </div>
        </div>
    )
}