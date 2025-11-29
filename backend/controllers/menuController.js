const pool = require('../db');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Add new product
exports.addProduct = async (req, res) => {
  const { name, price, image } = req.body;
  if (!name || price == null) return res.status(400).json({ message: 'Name and price required' });

  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
      [name, price, image || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Product added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, image } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE products SET name=?, price=?, image=? WHERE id=?",
      [name, price, image, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id=?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
