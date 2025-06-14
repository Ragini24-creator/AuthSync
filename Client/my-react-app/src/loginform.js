import { useState, useEffect, useRef } from "react";
import SSE from "./SSE";
import { getDeviceFingerprint } from './utils/fingerprint'
import useDeviceSSE from "./useDeviceSSE";



const LoginForm = function (props) {
    // handle submitted data after login/signup click event
    //    const [submittedData,setSubmittedData]


    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const [email, setEmailId] = useState(null);
    const [deviceId, setDeviceId] = useState(null);

    // useDeviceSSE(email, deviceId);  //Hook runs only if both exist

    //useEmergencySSE(email, deviceId)
    // const [userId, setUserId] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmission = async (e) => {
        e.preventDefault()
        let action = e.target.name
        const email = formData.email
        const password = formData.password
        setFormData({ email: "", password: "" });
        console.log(action, email, password)

        if (action) {
            const fingerprint = await getDeviceFingerprint();
            console.log("Line 32 of loginform.js Device Fingerprint:", fingerprint);

            const response = await fetch(`/authSync/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "email": email, "password": password, "deviceId": fingerprint })
                //...(action === "login" ? { credentials: "include" } : {})
            })

            const data = await response.json()
            if (action === 'login' && data.status === 'Success') {
                props.onSuccessfulLogin(true, data);

                console.log('after onSuccessfulLogin event',)
                // setTimeout(() => {
                //     setUserId(data.userData.userName); // Simulate user login
                // }, 2000);
                setEmailId(email)   // ✅ for hook
                setDeviceId(fingerprint);     // ✅ for hook


                SSE(data.userData.userName);
            }

            if (action === 'signup' && data.status === 'Success') {
                alert(`User Registered Successfully, please Login to get Started!`)
            }
            console.log(data)
        }
    }

    // if (userIdRef.current) {
    //     console.log('about to call SSE')

    // }


    return (
        <div className="login-form-div">
            <h2 className="project-title">AuthSync</h2>
            <form className="login-form">
                <p className="p-username" >Email</p>
                <input type="text" name="email" className="user-name" value={formData.email} onChange={handleChange} />
                <p className="p-password" >Password</p>
                <input type="password" name="password" className="password" value={formData.password} onChange={handleChange} />
                <button name="login" className="btn btn-login" onClick={handleSubmission}>Login</button>
                <button name="signup" className="btn btn-signup" onClick={handleSubmission}>signup</button>
            </form>
        </div>
    )
}

export { LoginForm };