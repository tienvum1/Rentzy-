const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

const path = require('path');



const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const passport = require("passport");
require("./auth/auth");

//routes
const authRoutes = require("./route/auth");
const userRoutes = require("./route/userRoutes");

dotenv.config();
const app = express();

app.use(cookieParser());

// Lấy PORT và origin từ biến môi trường
const PORT = process.env.PORT || 4999;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

// Cấu hình CORS
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mongoose Connection (Centralized here)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
});


// Check connection events directly on mongoose.connection
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoose.connection.once('open', function() {
  console.log("MongoDB connected successfully");
});

// Routes

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});


// Serve static files (for locally stored images)
// Configure this only if you are saving images locally as implemented in vehicleController
app.use('/uploads/vehicles', express.static(path.join(__dirname, 'uploads', 'vehicles')));

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
