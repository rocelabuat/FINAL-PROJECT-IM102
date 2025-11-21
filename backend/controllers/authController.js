// controllers/authController.js
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ REGISTER (customer only)
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Prevent duplicate email
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // ✅ Force all public registrations to "customer"
    const userRole = "customer";

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, userRole]
    );

    res.json({ message: "Customer registration successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// ✅ LOGIN (for all roles)
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "Invalid email or password." });

    const user = rows[0];

    // Optional: verify role match for safety
    if (role && user.role !== role)
      return res.status(403).json({ message: "You are trying to login as the wrong role." });

    const correct = await bcrypt.compare(password, user.password);
    if (!correct) return res.status(400).json({ message: "Invalid email or password." });

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
      message: "Login successful!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// ✅ LOGOUT
exports.logout = async (req, res) => {
  const { userId } = req.body;
  try {
    await pool.query("UPDATE users SET last_logout = NOW() WHERE id = ?", [userId]);
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};
