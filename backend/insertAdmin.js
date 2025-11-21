// insertStaffAndAdmin.js
const pool = require("./db"); // your db connection
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function createUser(name, email, password, role) {
  try {
    // Check if user already exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log(`${role} already exists. Updating password and role...`);
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET password = ?, role = ?, last_login = NULL, last_logout = NULL WHERE email = ?",
        [hashed, role, email]
      );
      console.log(`${role} account updated successfully!`);
      return;
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      "INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [crypto.randomUUID(), name, email, hashed, role]
    );
    console.log(`${role} account created successfully!`);
  } catch (err) {
    console.error(`Error creating ${role}:`, err);
  }
}

async function main() {
  await createUser("Staff User", "staffuser@gmail.com", "123456", "staff");
  await createUser("Admin User", "adminuser@gmail.com", "admin123", "admin");
  process.exit();
}

main();
