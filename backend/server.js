// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
// Enable CORS for all origins (for testing on mobile)
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const menuRoutes = require("./routes/menuRoutes");
app.use("/api/menu", menuRoutes);


// Default route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Start server
const PORT = process.env.PORT || 5000;
// Listen on all network interfaces so mobile can access
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
