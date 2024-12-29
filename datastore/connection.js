const mongoose = require("mongoose");
const PASSWORD = encodeURIComponent(process.env.DATABASE_PASSWORD);
const DB_URL = `mongodb+srv://Ragini:${PASSWORD}@cluster0.om43n.mongodb.net/AUTHSYNC?retryWrites=true&w=majority&appName=Cluster0`;


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
