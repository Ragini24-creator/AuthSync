import { useState } from "react";

export default function LoginForm(props) {
    // handle submitted data after login/signup click event
    //    const [submittedData,setSubmittedData]



    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

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
            const response = await fetch(`/authSync/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "email": email, "password": password })
            })

            const data = await response.json()
            if (action === 'login' && data.status === 'success') {
                props.onSuccessfulLogin(true, data);
            }
            console.log(data)
        }
    }


    return (
        <div className="login-form-div">
            <h2 className="project-title">AuthSync</h2>
            <form className="login-form">
                <p className="p-username" >Email</p>
                <input type="text" name="email" className="user-name" value={formData.email} onChange={handleChange} />
                <p className="p-password" >Password</p>
                <input type="password" name="password" className="password" value={formData.password} onChange={handleChange} />
                <button name="login" className="btn btn-login" onClick={handleSubmission}>Login</button>
                <button name="signup" className="btn btn-signup" onClick={handleSubmission}>Signup</button>
            </form>
        </div>
    )
}