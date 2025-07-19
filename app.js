const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const cors = require('cors')
const { generateJWT, setCookie, jwtAuthenticationMiddleware } = require('./utils/jwt.js')






const connectDB = require('./datastore/connection.js');
const mongoose = require("mongoose");
const PASSWORD = encodeURIComponent(process.env.DATABASE_PASSWORD);


const DB_URL = process.env.DATABASE_URL.replace('<PASSWORD>', PASSWORD)

const app = express();


const QR = require('qrcode')

const transferSession = require("./datastore/models/transferSession.js")

//Importing all routes
const userRoutes = require('./routes/userRoutes.js');
const sessionRoutes = require('./routes/sessionRoutes.js')

app.use(cors())
app.use(express.json());

connectDB();

app.listen(9000, '0.0.0.0', () => {
  console.log(`server is running on ${9000}`);
});




mongoose.connect(DB_URL).then((con) => {
  console.log(con.connections);
  console.log("DB connection successful!");
});


app.use('/authSync', userRoutes);
app.use('/authSync', sessionRoutes)

