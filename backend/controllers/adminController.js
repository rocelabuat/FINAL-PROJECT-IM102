// src/backend/controllers/adminController.js
const pool = require('../db');
const { Parser } = require('json2csv');
const bcrypt = require('bcryptjs');

/**
 * adminController.js
 * - Manual ingredient assignment for products (product_ingredients)
 * - Automatic deduction remains in DB trigger (trg_order_delivered_deduct)
 * - Controller inserts low-stock alerts:
 *    - After manual inventory updates (insert OR delete)
 *    - After an order is moved to 'delivered' (checks inventories used and inserts/deletes alerts)
 * - Improved multi-section CSV export for Excel
 */

/* ---------------------------
   DASHBOARD TOTALS
   --------------------------- */
exports.getDashboardTotals = async (req, res) => {
  try {
    const [revenueResult] = await pool.query(`
      SELECT IFNULL(SUM(total),0) AS todayRevenue
      FROM orders
      WHERE DATE(created_at)=CURDATE()
        AND status IN ('paid','delivered')
    `);

    const [totalOrdersResult] = await pool.query(`
      SELECT COUNT(*) AS totalOrders
      FROM orders
      WHERE status != 'cancelled'
    `);

    const [avgOrderResult] = await pool.query(`
      SELECT IFNULL(AVG(total),0) AS avgOrderValue
      FROM orders
      WHERE status != 'cancelled'
    `);

    const [totalMenuItemsResult] = await pool.query(`
      SELECT COUNT(*) AS totalMenuItems
      FROM products
      WHERE is_active = 1
    `);

    const [bestSellingResult] = await pool.query(`
      SELECT oi.name, SUM(oi.quantity) AS sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('pending','paid','delivered')
      GROUP BY oi.product_id
      ORDER BY sold DESC
      LIMIT 1
    `);

    res.json({
      todayRevenue: revenueResult[0]?.todayRevenue ?? 0,
      totalOrders: totalOrdersResult[0]?.totalOrders ?? 0,
      avgOrderValue: Number(avgOrderResult[0]?.avgOrderValue ?? 0).toFixed(2),
      totalMenuItems: totalMenuItemsResult[0]?.totalMenuItems ?? 0,
      bestSelling: bestSellingResult[0] || null,
    });
  } catch (err) {
    console.error("GET DASHBOARD TOTALS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch dashboard totals", error: err.message });
  }
};

/* ---------------------------
   ORDER STATUS COUNTS
   --------------------------- */
exports.getOrderStatusCounts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT status AS label, COUNT(*) AS count
      FROM orders
      WHERE status IN ('pending','delivered','cancelled','preparing','ready','paid','unverified')
      GROUP BY status
    `);

    const colors = {
      pending: "#FACC15",
      delivered: "#34D399",
      cancelled: "#F87171",
      preparing: "#FB923C",
      ready: "#60A5FA",
      paid: "#8B5CF6",
      unverified: "#94A3B8"
    };

    res.json(rows.map(r => ({
      ...r,
      color: colors[r.label] || "#ccc"
    })));
  } catch (err) {
    console.error("ORDER STATUS COUNTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch order status counts", error: err.message });
  }
};

/* ---------------------------
   PAYMENT COUNTS
   --------------------------- */
exports.getPaymentCounts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT payment_method AS method, COUNT(*) AS count
      FROM orders
      WHERE status IN ('pending','delivered','paid')
      GROUP BY payment_method
    `);

    const colorMap = {
      cod: "#3B82F6",
      gcash: "#FBBF24",
      cash: "#10B981",
      card: "#8B5CF6",
    };

    res.json(rows.map(r => ({
      ...r,
      color: colorMap[r.method?.toLowerCase()] || "#ccc"
    })));
  } catch (err) {
    console.error("PAYMENT METHOD COUNTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch payment counts", error: err.message });
  }
};

/* ---------------------------
   MENU MANAGEMENT + Ingredient CRUD
   --------------------------- */
exports.getMenuItems = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM products
      WHERE is_active = 1
      ORDER BY id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET MENU ITEMS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch menu items", error: err.message });
  }
};

exports.getProductIngredients = async (req, res) => {
  const productId = req.params.productId;
  try {
    const [rows] = await pool.query(`
      SELECT pi.id, pi.inventory_id, i.name AS inventory_name, pi.qty_per_item
      FROM product_ingredients pi
      JOIN inventory i ON pi.inventory_id = i.id
      WHERE pi.product_id = ?
    `, [productId]);
    res.json(rows);
  } catch (err) {
    console.error("GET PRODUCT INGREDIENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch product ingredients", error: err.message });
  }
};

exports.createMenuItem = async (req, res) => {
  const { name, description, price, category, available = 1, popular = 0, ingredients = [] } = req.body;

  if (!name || typeof price !== 'number') {
    return res.status(400).json({ message: "Name and valid price required" });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [result] = await conn.query(`
      INSERT INTO products (name, description, price, category, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
    `, [name, description || null, price, category || null]);

    const productId = result.insertId;

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const ingValues = ingredients.map(ing => [productId, ing.inventory_id, ing.qty_per_item]);
      await conn.query(`
        INSERT INTO product_ingredients (product_id, inventory_id, qty_per_item)
        VALUES ?
      `, [ingValues]);
    }

    await conn.commit();
    res.status(201).json({ message: "Menu item created", id: productId });
  } catch (err) {
    await conn.rollback();
    console.error("CREATE MENU ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to create menu item", error: err.message });
  } finally {
    conn.release();
  }
};

exports.updateMenuItem = async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, category, available, popular, ingredients } = req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [result] = await conn.query(`
      UPDATE products
      SET name=?, description=?, price=?, category=?, updated_at=NOW()
      WHERE id=? AND is_active = 1
    `, [name, description || null, price, category || null, productId]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (Array.isArray(ingredients)) {
      await conn.query(`DELETE FROM product_ingredients WHERE product_id=?`, [productId]);
      if (ingredients.length > 0) {
        const ingValues = ingredients.map(ing => [productId, ing.inventory_id, ing.qty_per_item]);
        await conn.query(`
          INSERT INTO product_ingredients (product_id, inventory_id, qty_per_item)
          VALUES ?
        `, [ingValues]);
      }
    }

    await conn.commit();
    res.json({ message: "Menu item updated", id: productId });
  } catch (err) {
    await conn.rollback();
    console.error("UPDATE MENU ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to update menu item", error: err.message });
  } finally {
    conn.release();
  }
};

exports.deleteMenuItem = async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query(`
      UPDATE products
      SET is_active = 0
      WHERE id=?
    `, [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Menu item not found" });

    res.json({ message: "Menu item deleted (soft)", id });
  } catch (err) {
    console.error("DELETE MENU ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to delete menu item", error: err.message });
  }
};

/* ---------------------------
   PRODUCT_INGREDIENTS CRUD
   --------------------------- */
exports.addProductIngredient = async (req, res) => {
  const productId = req.params.productId;
  const { inventory_id, qty_per_item } = req.body;
  if (!inventory_id || typeof qty_per_item !== 'number') {
    return res.status(400).json({ message: "inventory_id and numeric qty_per_item required" });
  }
  try {
    const [result] = await pool.query(`
      INSERT INTO product_ingredients (product_id, inventory_id, qty_per_item)
      VALUES (?, ?, ?)
    `, [productId, inventory_id, qty_per_item]);
    res.status(201).json({ message: "Ingredient added", id: result.insertId });
  } catch (err) {
    console.error("ADD PRODUCT INGREDIENT ERROR:", err);
    res.status(500).json({ message: "Failed to add ingredient", error: err.message });
  }
};

exports.deleteProductIngredient = async (req, res) => {
  const ingredientId = req.params.ingredientId;
  try {
    const [result] = await pool.query(`DELETE FROM product_ingredients WHERE id=?`, [ingredientId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Ingredient not found" });
    res.json({ message: "Ingredient deleted", id: ingredientId });
  } catch (err) {
    console.error("DELETE PRODUCT INGREDIENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete ingredient", error: err.message });
  }
};

/* ---------------------------
   INVENTORY MANAGEMENT (manual edits) + low-stock alerts
   --------------------------- */
exports.getInventory = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, stock, threshold, (stock <= threshold) AS low_stock, updated_at
      FROM inventory
      ORDER BY id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET INVENTORY ERROR:", err);
    res.status(500).json({ message: "Failed to fetch inventory", error: err.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  const id = req.params.id;
  const { stock } = req.body;  // New stock value after update (could be manual addition or deduction)

  if (typeof stock !== 'number') {
    return res.status(400).json({ message: "Valid numeric stock is required" });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [[item]] = await conn.query(`SELECT stock, threshold, name FROM inventory WHERE id=? FOR UPDATE`, [id]);
    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Prevent stock from going negative manually
    if (stock < 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    const difference = stock - item.stock;

    // If the new stock value is greater than the current stock, update inventory (manual addition)
    if (difference > 0) {
      await conn.query(`UPDATE inventory SET stock=?, updated_at=NOW() WHERE id=?`, [stock, id]);
      await conn.query(`INSERT INTO inventory_logs (inventory_id, change_amount, reason, created_at) VALUES (?, ?, ?, NOW())`, [id, difference, 'Manual stock addition']);
    }

    // If the new stock value is less than the current stock, update inventory (manual deduction)
    if (difference < 0) {
      await conn.query(`UPDATE inventory SET stock=?, updated_at=NOW() WHERE id=?`, [stock, id]);
      await conn.query(`INSERT INTO inventory_logs (inventory_id, change_amount, reason, created_at) VALUES (?, ?, ?, NOW())`, [id, difference, 'Manual stock deduction']);
    }

    // Check if the stock is below the threshold after the update and trigger low-stock alert
    if (stock <= item.threshold) {
      await conn.query(`
        INSERT IGNORE INTO low_stock_alerts (inventory_id, message, alerted_at)
        VALUES (?, ?, NOW())
      `, [id, `${item.name} is low on stock!`]);
    } else {
      // Remove low-stock alert if stock is above the threshold
      await conn.query(`DELETE FROM low_stock_alerts WHERE inventory_id = ?`, [id]);
    }

    await conn.commit();
    res.json({ message: "Inventory updated", id });
  } catch (err) {
    await conn.rollback();
    console.error("UPDATE INVENTORY ERROR:", err);
    res.status(500).json({ message: "Failed to update inventory", error: err.message });
  } finally {
    conn.release();
  }
};


/* ---------------------------
   LOW-STOCK ALERTS GET
   --------------------------- */
exports.getLowStockAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.id, l.inventory_id, i.name, i.stock, i.threshold, l.message, l.alerted_at
      FROM low_stock_alerts l
      JOIN inventory i ON l.inventory_id = i.id
      ORDER BY l.alerted_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET LOW STOCK ALERTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch low stock alerts", error: err.message });
  }
};

/* ---------------------------
   SALES SUMMARY EXPORT (Multi-section CSV for Excel)
   --------------------------- */
const buildCsvSection = (title, headers = [], rows = []) => {
  let out = '';
  if (title) out += `${title}\r\n`;
  if (headers && headers.length) out += `${headers.join(',')}\r\n`;
  if (rows && rows.length) {
    for (const r of rows) {
      if (Array.isArray(r)) {
        out += `${r.map(v => escapeCsv(v)).join(',')}\r\n`;
      } else if (typeof r === 'object') {
        if (headers && headers.length) {
          out += `${headers.map(h => escapeCsv(r[h] ?? '')).join(',')}\r\n`;
        } else {
          out += `${Object.values(r).map(v => escapeCsv(v)).join(',')}\r\n`;
        }
      } else {
        out += `${escapeCsv(r)}\r\n`;
      }
    }
  }
  out += '\r\n';
  return out;
};

const escapeCsv = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[,"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

exports.exportSalesSummary = async (req, res) => {
  try {
    // Overview
    const [overviewRows] = await pool.query(`
      SELECT
        IFNULL(SUM(CASE WHEN status IN ('pending','paid','delivered') THEN total ELSE 0 END),0) AS total_revenue,
        COUNT(CASE WHEN status IN ('pending','paid','delivered') THEN id END) AS total_orders,
        IFNULL(AVG(CASE WHEN status IN ('pending','paid','delivered') THEN total ELSE NULL END),0) AS avg_order_value
      FROM orders
    `);
    const overview = overviewRows[0] || { total_revenue: 0, total_orders: 0, avg_order_value: 0 };

    // Daily - last 7 days
    const [daily] = await pool.query(`
      SELECT DATE(created_at) AS day, IFNULL(SUM(total),0) AS amount
      FROM orders
      WHERE status IN ('pending','paid','delivered')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    // Weekly - last 12 weeks
    const [weekly] = await pool.query(`
      SELECT YEARWEEK(created_at,1) AS yw, CONCAT('Week ', WEEK(created_at,1), ' (', YEAR(created_at), ')') AS label, IFNULL(SUM(total),0) AS amount
      FROM orders
      WHERE status IN ('pending','paid','delivered')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 83 DAY)
      GROUP BY YEARWEEK(created_at,1)
      ORDER BY YEARWEEK(created_at,1)
    `);

    // Monthly - current year
    const [monthly] = await pool.query(`
      SELECT MONTH(created_at) AS m, DATE_FORMAT(created_at, '%b') AS month, IFNULL(SUM(total),0) AS amount
      FROM orders
      WHERE status IN ('pending','paid','delivered')
        AND YEAR(created_at) = YEAR(CURDATE())
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `);

    // Yearly - last 3 years
    const [yearly] = await pool.query(`
      SELECT YEAR(created_at) AS y, IFNULL(SUM(total),0) AS amount
      FROM orders
      WHERE status IN ('pending','paid','delivered')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
      GROUP BY YEAR(created_at)
      ORDER BY YEAR(created_at)
    `);

    // Top Products
    const [topProducts] = await pool.query(`
      SELECT oi.name AS product_name, SUM(oi.quantity) AS quantity_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('pending','paid','delivered')
      GROUP BY oi.product_id
      ORDER BY quantity_sold DESC
      LIMIT 10
    `);

    // Build CSV
// Helper function to format numbers to two decimal places
const formatNumber = (num) => Number(num).toFixed(2);

// Build the CSV content in a more professional layout
let csv = '';

// ==============================
// DATE - First thing at the top
// ==============================
const options = { 
  year: "numeric",
  month: "2-digit", 
  day: "2-digit",   
  timeZone: "Asia/Manila"
};

// Get the current date in Philippine Standard Time (PST)
const formattedDate = new Date().toLocaleDateString("en-US", options);

// Add the current date at the very top of the file
csv += `Report Date: ${formattedDate}\n\n`;

// ==============================
// SALES SUMMARY
// ==============================
csv += 'Sales Summary\n';
csv += 'Total Revenue, Total Orders, Average Order Value\n';
csv += `${formatNumber(overview.total_revenue)}, ${overview.total_orders}, ${formatNumber(overview.avg_order_value)}\n\n`;

// ==============================
// DAILY REVENUE (last 7 days)
// ==============================
csv += 'Daily Revenue (Last 7 Days)\n';
csv += 'Date, Amount\n';
daily.forEach(r => {
  // Convert the date to Philippine Time (PST)
  const dateInPST = new Date(r.day);
  const formattedDay = dateInPST.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
  
  csv += `${formattedDay}, ${formatNumber(r.amount)}\n`;
});
csv += '\n';
// ==============================
// WEEKLY REVENUE (last 12 weeks)
// ==============================
csv += 'Weekly Revenue (Last 12 Weeks)\n';
csv += 'Week, Amount\n';
weekly.forEach(r => {
  csv += `${r.label}, ${formatNumber(r.amount)}\n`;
});
csv += '\n';

// ==============================
// MONTHLY REVENUE (current year)
// ==============================
csv += 'Monthly Revenue (Current Year)\n';
csv += 'Month, Amount\n';
monthly.forEach(r => {
  csv += `${r.month}, ${formatNumber(r.amount)}\n`;
});
csv += '\n';

// ==============================
// YEARLY REVENUE (last 3 years)
// ==============================
csv += 'Yearly Revenue (Last 3 Years)\n';
csv += 'Year, Amount\n';
yearly.forEach(r => {
  csv += `${r.y}, ${formatNumber(r.amount)}\n`;
});
csv += '\n';

// ==============================
// TOP PRODUCTS
// ==============================
csv += 'Top Products\n';
csv += 'Product, Quantity Sold\n';
topProducts.forEach(r => {
  csv += `${r.product_name}, ${r.quantity_sold}\n`;
});  // <-- Closing the forEach loop for top products

// ==============================
// Filename based on current date (Philippine Time)
// ==============================
const filename = `Sales_Report_${formattedDate}.csv`;

// Set the appropriate headers for file download
res.setHeader("Content-Type", "text/csv");
res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

// Send the CSV content as a response
return res.send(csv);



// ⬆⬆⬆ STOP HERE

  } catch (err) {
    console.error("EXPORT SALES SUMMARY ERROR:", err);
    res.status(500).json({ message: "Failed to export sales summary", error: err.message });
  }
};

/* ---------------------------
   STAFF & ADMIN REGISTRATION
   --------------------------- */
exports.registerStaff = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(`
      INSERT INTO users (name, email, password, role, created_at)
      VALUES (?, ?, ?, 'staff', NOW())
    `, [name, email, hashed]);

    res.status(201).json({ message: "Staff account created successfully" });
  } catch (err) {
    console.error("REGISTER STAFF ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(`
      INSERT INTO users (name, email, password, role, created_at)
      VALUES (?, ?, ?, 'admin', NOW())
    `, [name, email, hashed]);

    res.json({ message: "Admin account created successfully!" });
  } catch (err) {
    console.error("REGISTER ADMIN ERROR:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

/* ---------------------------
   ORDER STATUS UPDATE
   - Uses DB trigger to deduct inventory.
   - After moving to 'delivered', controller:
       - sets orders.inventory_deducted = 1
       - checks related inventory entries; inserts/deletes low_stock_alerts accordingly
   --------------------------- */
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = [
    'pending', 'preparing', 'ready',
    'delivered', 'paid', 'unverified', 'cancelled'
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [rows] = await conn.query(`SELECT status, inventory_deducted FROM orders WHERE id=? FOR UPDATE`, [orderId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = rows[0].status;
    const alreadyDeducted = !!rows[0].inventory_deducted;

    // Prevent changing a delivered order to something else
    if (oldStatus === 'delivered' && status !== 'delivered') {
      await conn.rollback();
      return res.status(400).json({ message: "Cannot change status after delivered" });
    }

    // Only update if changed
    if (oldStatus !== status) {
      await conn.query(`UPDATE orders SET status=?, updated_at=NOW() WHERE id=?`, [status, orderId]);
    }

    await conn.commit();

    // If new status is delivered and controller hasn't processed alerts yet
    if (status === 'delivered' && !alreadyDeducted) {
      try {
        // mark inventory_deducted so we don't run this twice from controller
        await pool.query(`UPDATE orders SET inventory_deducted = 1 WHERE id=?`, [orderId]);

        // find all inventory ids affected by this order (via product_ingredients)
        const [affectedInventory] = await pool.query(`
          SELECT DISTINCT i.id AS inventory_id, i.name AS inventory_name, i.stock, i.threshold
          FROM inventory i
          JOIN product_ingredients pi ON pi.inventory_id = i.id
          JOIN order_items oi ON oi.product_id = pi.product_id
          WHERE oi.order_id = ?
        `, [orderId]);

        // Insert or delete low stock alerts based on new stock
        for (const inv of affectedInventory) {
          if (inv.stock <= inv.threshold) {
            await pool.query(`
              INSERT IGNORE INTO low_stock_alerts (inventory_id, message, alerted_at)
              VALUES (?, ?, NOW())
            `, [inv.inventory_id, `${inv.inventory_name} is low on stock!`]);
          } else {
            // remove any previous alert if stock is now above threshold
            await pool.query(`DELETE FROM low_stock_alerts WHERE inventory_id = ?`, [inv.inventory_id]);
          }
        }
      } catch (innerErr) {
        console.error("POST-DELIVERY ALERT INSERT ERROR:", innerErr);
      }
    }

    // fetch and return updated order
    const [updatedOrderRows] = await pool.query(`SELECT * FROM orders WHERE id=?`, [orderId]);
    res.json({ message: `Order status updated to ${status}`, order: updatedOrderRows[0] });
  } catch (err) {
    await conn.rollback();
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status", error: err.message });
  } finally {
    conn.release();
  }
};

exports.getDailyRevenue = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.date AS raw_date,
        DATE_FORMAT(d.date, '%b %d') AS label,
        COALESCE(SUM(o.total), 0) AS amount
      FROM (
        SELECT CURDATE() - INTERVAL n DAY AS date
        FROM (
          SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 
          UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
        ) days
      ) d
      LEFT JOIN orders o
        ON DATE(o.created_at) = d.date
        AND o.status IN ('pending','paid','delivered')
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    // 🚨 FORCE numbers (extra safety)
    const clean = rows.map(r => ({
      label: r.label,
      amount: Number(r.amount) || 0
    }));

    res.json(clean);
  } catch (err) {
    console.error("GET DAILY ERROR:", err);
    res.status(500).json({ message: "Failed to fetch daily revenue" });
  }
};




exports.getWeeklyRevenue = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        YEARWEEK(created_at, 1) AS week_key,
        CONCAT('Week ', WEEK(created_at,1)) AS label,
        IFNULL(SUM(total), 0) AS amount
      FROM orders
      WHERE status IN ('pending','paid','delivered')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      GROUP BY YEARWEEK(created_at, 1)
      ORDER BY YEARWEEK(created_at, 1)
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET WEEKLY ERROR:", err);
    res.status(500).json({ message: "Failed to fetch weekly revenue" });
  }
};


exports.getMonthlyRevenue = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        MONTH(created_at) AS month_key,
        DATE_FORMAT(created_at, '%b') AS label,
        IFNULL(SUM(total), 0) AS amount
      FROM orders
      WHERE status IN ('pending','paid','delivered')
        AND YEAR(created_at) = YEAR(CURDATE())
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET MONTHLY ERROR:", err);
    res.status(500).json({ message: "Failed to fetch monthly revenue" });
  }
};


exports.getTopSellingProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        oi.name AS name, 
        SUM(oi.quantity) AS quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('pending','paid','delivered')
      GROUP BY oi.product_id
      ORDER BY quantity DESC
      LIMIT 3
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET TOP PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch top products" });
  }
};

exports.addStock = async (req, res) => {
  const id = req.params.id;  // Get the inventory ID from the request
  const { quantity } = req.body;  // Get the quantity to add from the request body

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    // Fetch the inventory item
    const [[item]] = await conn.query(`SELECT stock, threshold, name FROM inventory WHERE id=? FOR UPDATE`, [id]);
    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Add the stock to the current stock value
    const updatedStock = item.stock + quantity;

    // Update the stock in the database
    await conn.query(`UPDATE inventory SET stock=?, updated_at=NOW() WHERE id=?`, [updatedStock, id]);

    // Log the stock addition in inventory_logs
    await conn.query(`INSERT INTO inventory_logs (inventory_id, change_amount, reason, created_at) VALUES (?, ?, ?, NOW())`, [id, quantity, 'Manual stock addition']);

    // Check if the stock is now below the threshold
    if (updatedStock <= item.threshold) {
      // Insert a low stock alert if stock is below or equal to the threshold
      await conn.query(`
        INSERT IGNORE INTO low_stock_alerts (inventory_id, message, alerted_at)
        VALUES (?, ?, NOW())
      `, [id, `${item.name} is low on stock!`]);
    } else {
      // Remove low-stock alert if stock is above threshold
      await conn.query(`DELETE FROM low_stock_alerts WHERE inventory_id = ?`, [id]);
    }

    await conn.commit();
    res.json({ message: "Stock added successfully", id });
  } catch (err) {
    await conn.rollback();
    console.error("ADD STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to add stock", error: err.message });
  } finally {
    conn.release();
  }
};
