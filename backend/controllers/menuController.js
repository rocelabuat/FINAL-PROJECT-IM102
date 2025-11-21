// controllers/menuController.js
const pool = require('../db');

// Get all available menu items
exports.getMenu = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu WHERE available = 1 ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error("GET MENU ERROR:", err);
    res.status(500).json({ message: "Failed to fetch menu", error: err.message });
  }
};

// Add menu item
exports.addMenuItem = async (req, res) => {
  const { name, description, price, image, category } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO menu (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, image, category]
    );
    res.status(201).json({ id: result.insertId, message: "Menu item added" });
  } catch (err) {
    console.error("ADD MENU ERROR:", err);
    res.status(500).json({ message: "Failed to add menu item", error: err.message });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, available } = req.body;
  try {
    await pool.query(
      'UPDATE menu SET name=?, description=?, price=?, image=?, category=?, available=? WHERE id=?',
      [name, description, price, image, category, available, id]
    );
    res.json({ message: "Menu item updated" });
  } catch (err) {
    console.error("UPDATE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to update menu item", error: err.message });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu WHERE id=?', [id]);
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    console.error("DELETE MENU ERROR:", err);
    res.status(500).json({ message: "Failed to delete menu item", error: err.message });
  }
};
