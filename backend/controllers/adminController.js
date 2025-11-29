const pool = require("../db");

// -------------------------
// GET MENU ITEMS
// -------------------------
const getMenuItems = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM menu");
    // Ensure price is a number
    const menu = rows.map(item => ({ ...item, price: Number(item.price) }));
    res.json(menu);
  } catch (err) {
    console.error("Error fetching menu:", err);
    res.status(500).json({ message: "Failed to fetch menu" });
  }
};

// -------------------------
// GET INVENTORY
// -------------------------
const getInventory = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM inventory");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

// -------------------------
// GET DASHBOARD TOTALS
// -------------------------
const getDashboardTotals = async (req, res) => {
  try {
    // Total sales
    const [salesRows] = await pool.query("SELECT SUM(total_amount) AS totalSales FROM orders");
    const totalSales = salesRows[0].totalSales || 0;

    // Total orders
    const [ordersRows] = await pool.query("SELECT COUNT(*) AS totalOrders FROM orders");
    const totalOrders = ordersRows[0].totalOrders || 0;

    // Pending orders
    const [pendingRows] = await pool.query("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status='pending'");
    const pendingOrders = pendingRows[0].pendingOrders || 0;

    res.json({
      totalSales: Number(totalSales),
      totalOrders,
      pendingOrders
    });
  } catch (err) {
    console.error("Error fetching dashboard totals:", err);
    res.status(500).json({ message: "Failed to fetch dashboard totals" });
  }
};

module.exports = {
  getMenuItems,
  getInventory,
  getDashboardTotals
};
