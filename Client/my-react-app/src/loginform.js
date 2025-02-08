import { useState } from "react";

export default function LoginForm() {
    // handle submitted data after login/signup click event
    //    const [submittedData,setSubmittedData]



    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }


    return (
        <div className="login-form-div">
            <h2 className="project-title">AuthSync</h2>
            <form className="login-form">
                <p className="p-username" >Email</p>
                <input type="text" name="email" className="user-name" value={formData.email} onChange={handleChange} />
                <p className="p-password" >Password</p>
                <input type="password" name="password" className="password" value={formData.password} onChange={handleChange} />
                <button className="btn btn-login">Login</button>
                <button className="btn btn-signup">Signup</button>
            </form>
        </div>
    )
}