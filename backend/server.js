// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require("node-cron");
const pool = require("./db"); // assuming you have a db.js exporting a MySQL pool

const app = express();

// Middlewares
app.use(cors()); // Enable CORS for all origins (mobile testing)
app.use(express.json()); // Parse JSON bodies

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const menuRoutes = require("./routes/menuRoutes");
app.use("/api/menu", menuRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);


// Default route
app.get("/", (req, res) => {
  res.send("API is running");
});

// -------------------------
// DAILY RESET (MIDNIGHT)
// -------------------------
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running daily inventory reset at midnight...");

    // Clear low stock alerts
    await pool.query("DELETE FROM low_stock_alert");

    // Optional: clear old inventory logs (keep last 7 days if you want)
    await pool.query("DELETE FROM inventory_log WHERE changed_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)");

    console.log("Inventory logs and low stock alerts reset successfully.");
  } catch (err) {
    console.error("Failed to reset inventory:", err);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
