const jwt = require("jsonwebtoken");
const pool = require("../db");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user info from DB (including role)
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach full user object to request
    req.user = rows[0]; // id, name, email, role

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
