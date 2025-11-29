const pool = require('../db');

// Get all inventory items
exports.getInventory = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    // Get old stock
    const [oldRow] = await pool.query('SELECT stock FROM inventory WHERE id = ?', [id]);
    if (!oldRow.length) return res.status(404).json({ message: 'Inventory item not found' });

    const oldStock = oldRow[0].stock;

    // Update stock
    await pool.query('UPDATE inventory SET stock = ? WHERE id = ?', [stock, id]);

    // Log the change
    await pool.query(
      'INSERT INTO inventory_log (inventory_id, change_type, old_stock, new_stock, changed_at) VALUES (?, ?, ?, ?, NOW())',
      [id, 'update', oldStock, stock]
    );

    // Check for low stock alert
    const [item] = await pool.query('SELECT low_stock_threshold FROM inventory WHERE id = ?', [id]);
    if (stock < item[0].low_stock_threshold) {
      await pool.query(
        'INSERT INTO low_stock_alert (inventory_id, message, alerted_at) VALUES (?, ?, NOW())',
        [id, `Low stock alert: item stock is ${stock}`]
      );
    }

    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update stock' });
  }
};
