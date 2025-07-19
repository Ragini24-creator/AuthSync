const mongoose = require("mongoose");
const PASSWORD = encodeURIComponent(process.env.DATABASE_PASSWORD);
const DB_URL = process.env.DATABASE_URL.replace('<PASSWORD>', PASSWORD)

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL);
        console.log('Database connection successful...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1); // Exit with failure
    }
};

module.exports = connectDB;
