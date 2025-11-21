// insertStaff.js
const pool = require("./db"); // make sure this points to your db.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // for generating a unique ID

async function createStaff() {
  try {
    const name = "Staff User";
    const email = "staffuser@gmail.com";
    const password = "123456"; // plaintext password
    const role = "staff";

    // Check if staff already exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log("Staff already exists. Updating password and role...");
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET password = ?, role = ?, last_login = NULL, last_logout = NULL WHERE email = ?",
        [hashed, role, email]
      );
      console.log("Staff account updated successfully!");
      process.exit();
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert staff
    await pool.query(
      "INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [crypto.randomUUID(), name, email, hashed, role]
    );

    console.log("Staff account created successfully!");
    process.exit();
  } catch (err) {
    console.error("Error creating staff:", err);
    process.exit(1);
  }
}

createStaff();
