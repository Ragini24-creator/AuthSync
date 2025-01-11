const validateUserInput = (req, res, next) => {

    const { email, password } = req.body
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Email format is invalid" });
    }

    if (!password || password.length < 8) {
        return res.status(400).send("password must be of atleast  8 characters ");
    }

    next();
};

module.exports = { validateUserInput };