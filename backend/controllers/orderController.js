// src/backend/controllers/orderController.js
const pool = require('../db');

/**
 * Helpers
 */
const now = () => new Date();

const isOnlinePaymentMethod = (method) => {
  return method === 'gcash' || method === 'cod';
};

/**
 * Helper used when a staff action should auto-assign the order to them.
 * Uses the provided connection (conn) so it can be used inside transactions.
 */
async function assignOrderIfNeeded(conn, orderId, staffId) {
  if (!staffId) return;
  await conn.query(
    `UPDATE orders
     SET staff_id = ?
     WHERE id = ? AND (staff_id IS NULL OR staff_id = 0)`,
    [staffId, orderId]
  );
}

/** ----------------------
 * CREATE ORDER
 * Handles both online orders (customers) and walk-in created by staff
 * ---------------------- */
exports.createOrder = async (req, res) => {
  const {
    firstName, lastName, phone, address, barangay,
    city, province, postal,
    payment_method = 'cash', gcash_ref,
    subtotal = 0, delivery_fee = 0, tax = 0, total = 0,
    items,
    order_source
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order items are required" });
  }

  for (const item of items) {
    if (
      !item.product_id ||
      !item.name ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      item.price < 0
    ) {
      return res.status(400).json({
        message: "Each item must have product_id, name, valid price and quantity"
      });
    }
  }

  const userId = req.user?.id || null;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const resolvedOrderSource = order_source || (userId ? 'online' : 'walkin');

    let status = 'unverified';
    let payment_status = 'unverified';

    if (resolvedOrderSource === 'walkin') {
      if (payment_method === 'cash' || payment_method === 'card') {
        status = 'pending';
        payment_status = payment_method === 'card' ? 'paid' : 'pending';
      } else if (isOnlinePaymentMethod(payment_method)) {
        status = 'unverified';
        payment_status = 'unverified';
      }
    } else {
      // Online order
      if (payment_method === 'cod' || payment_method === 'gcash') {
        status = 'unverified';
        payment_status = 'unverified';
      } else {
        status = 'pending';
        payment_status = 'pending';
      }
    }

    const createdAt = now();
    const initialNotified = (resolvedOrderSource === 'online' && (payment_method === 'cod' || payment_method === 'gcash')) ? 1 : 0;

    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (user_id, firstName, lastName, phone, address, barangay, city, province, postal,
        payment_method, gcash_ref, subtotal, delivery_fee, tax, total,
        order_source, notified, items, status, payment_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        firstName || null,
        lastName || null,
        phone || null,
        address || null,
        barangay || null,
        city || null,
        province || null,
        postal || null,
        payment_method,
        gcash_ref || null,
        subtotal,
        delivery_fee,
        tax,
        total,
        resolvedOrderSource,
        initialNotified,
        JSON.stringify(items),
        status,
        payment_status,
        createdAt
      ]
    );

    const orderId = orderResult.insertId;

    const itemPromises = items.map(item =>
      connection.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity]
      )
    );
    await Promise.all(itemPromises);

    await connection.commit();
    connection.release();

    res.status(201).json({
      id: orderId,
      message: "Order created successfully",
      status,
      payment_status,
      order_source: resolvedOrderSource,
      notified: initialNotified
    });
  } catch (err) {
    if (connection) { try { await connection.rollback(); } catch (_) {} try { connection.release(); } catch (_) {} }
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
};

/** ----------------------
 * GET USER ORDERS
 * ---------------------- */
exports.getUserOrders = async (req, res) => {
  if (!req.user?.id)
    return res.status(401).json({ message: "User not authenticated" });

  try {
    // 1️⃣ Fetch all orders for the user, most recent first
    const [ordersRows] = await pool.query(
      `SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC`,
      [req.user.id]
    );

    // 2️⃣ Map orders and add per-user order number
    const ordersWithNumber = ordersRows.map((order, index) => ({
      ...order,
      customer_order_number: index + 1 // starts at 1 for this user
    }));

    // 3️⃣ Fetch items for each order
    const ordersWithItems = await Promise.all(
      ordersWithNumber.map(async order => {
        const [items] = await pool.query(
          `SELECT * FROM order_items WHERE order_id=?`,
          [order.id]
        );
        return {
          ...order,
          items
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    console.error("GET USER ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch user orders", error: err.message });
  }
};

/** ----------------------
 * GET ALL ORDERS (STAFF/ADMIN)
 * Shows orders that are unassigned OR assigned to the current staff
 * ---------------------- */
exports.getOrders = async (req, res) => {
  const staffId = req.user?.id;

  if (!staffId)
    return res.status(401).json({ message: "Staff not authenticated" });

  try {
    const { status, payment_method, payment_status, orderId, onlyNotified } = req.query;

    let query = `
      SELECT * FROM orders
      WHERE (staff_id IS NULL OR staff_id = ?)
    `;
    const params = [staffId];

    if (status) { query += " AND status=?"; params.push(status); }
    if (payment_method) { query += " AND payment_method=?"; params.push(payment_method); }
    if (payment_status) { query += " AND payment_status=?"; params.push(payment_status); }
    if (orderId) { query += " AND id=?"; params.push(orderId); }
    if (onlyNotified === '1' || onlyNotified === 'true') { query += " AND notified=0"; }

    query += " ORDER BY created_at DESC";

    const [ordersRows] = await pool.query(query, params);

    const ordersWithItems = await Promise.all(
      ordersRows.map(async order => {
        const [items] = await pool.query(
          `SELECT * FROM order_items WHERE order_id=?`,
          [order.id]
        );

        return { ...order, items };
      })
    );

    res.json(ordersWithItems);

  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};

/** ----------------------
 * SUBMIT GCASH REFERENCE (Customer)
 * ---------------------- */
exports.submitGcashReference = async (req, res) => {
  const orderId = req.params.id;
  const { gcash_ref } = req.body;
  if (!gcash_ref) return res.status(400).json({ message: "GCash reference required" });

  try {
    const [result] = await pool.query(
      `UPDATE orders 
       SET gcash_ref=?, payment_status='unverified', status='unverified', order_source='online', notified=1 
       WHERE id=? AND payment_method='gcash'`,
      [gcash_ref, orderId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found or not a GCash order" });

    res.json({ message: "GCash reference submitted, staff notified for verification." });
  } catch (err) {
    console.error("SUBMIT GCASH REF ERROR:", err);
    res.status(500).json({ message: "Failed to submit GCash reference", error: err.message });
  }
};

/** ----------------------
 * VERIFY PAYMENT (STAFF)
 * ---------------------- */
exports.verifyPayment = async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user?.id || null;

  if (!staffId)
    return res.status(401).json({ message: "Staff must be authenticated" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the order row for update
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id=? FOR UPDATE`, [orderId]);
    if (rows.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ message: "Order not found" });
    }

    const order = rows[0];

    if (order.payment_status === 'paid') {
      await conn.rollback(); conn.release();
      return res.status(400).json({ message: "Order payment already verified" });
    }

    // Assign staff if not assigned yet
    await assignOrderIfNeeded(conn, orderId, staffId);

    // Recalculate totals in case items changed
    const [itemsRows] = await conn.query(`SELECT price, quantity FROM order_items WHERE order_id=?`, [orderId]);
    const recalculatedSubtotal = itemsRows.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const recalculatedTotal = Number((recalculatedSubtotal + Number(order.delivery_fee) + Number(order.tax)).toFixed(2));

    // Update order: payment verified, update status if unverified
    const [updateResult] = await conn.query(
      `UPDATE orders
       SET 
         payment_status='paid',
         status = CASE 
                    WHEN status='unverified' THEN 'pending' 
                    ELSE status 
                  END,
         subtotal=?,
         total=?,
         verified_at=NOW()
       WHERE id=?`,
      [recalculatedSubtotal, recalculatedTotal, orderId]
    );

    if (updateResult.affectedRows === 0) {
      await conn.rollback(); conn.release();
      return res.status(500).json({ message: "Failed to update order during verification" });
    }

    await conn.commit();
    conn.release();

    const updatedStatus = (order.status === 'unverified') ? 'pending' : order.status;

    res.json({
      message: "Payment verified successfully",
      orderId,
      payment_status: 'paid',
      status: updatedStatus,
      verified_at: new Date(),
      subtotal: recalculatedSubtotal,
      total: recalculatedTotal
    });

  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
      try { conn.release(); } catch (_) {}
    }
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to verify payment", error: err.message });
  }
};

/** ----------------------
 * UPDATE ORDER STATUS (STAFF)
 * ---------------------- */
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user?.id;

  const { status } = req.body;
  const validStatuses = [
    'pending','preparing','ready','delivered','paid','unverified','cancelled'
  ];

  if (!status || !validStatuses.includes(status))
    return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });

  try {
    // Assign staff first (only if not yet assigned)
    await pool.query(
      `UPDATE orders SET staff_id=? WHERE id=? AND (staff_id IS NULL OR staff_id = 0)`,
      [staffId, orderId]
    );

    const [result] = await pool.query(
      `UPDATE orders SET status=? WHERE id=?`,
      [status, orderId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });

    res.json({ message: `Order status updated to ${status}`, orderId });

  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status", error: err.message });
  }
};

/** ----------------------
 * MARK ORDER NOTIFIED (STAFF)
 * ---------------------- */
exports.markOrderNotified = async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user?.id;

  try {
    await pool.query(
      `UPDATE orders SET staff_id=? WHERE id=? AND (staff_id IS NULL OR staff_id = 0)`,
      [staffId, orderId]
    );

    const [result] = await pool.query(
      `UPDATE orders SET notified=1 WHERE id=?`,
      [orderId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order marked as notified" });

  } catch (err) {
    console.error("MARK NOTIFIED ERROR:", err);
    res.status(500).json({ message: "Failed to mark notified", error: err.message });
  }
};

/** ----------------------
 * CANCEL ORDER (CUSTOMER)
 * ---------------------- */
exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "User not authenticated" });

  try {
    const [result] = await pool.query(
      `UPDATE orders
       SET status='cancelled', payment_status='cancelled'
       WHERE id=? AND user_id=? AND status IN ('pending', 'unverified', 'preparing')`,
      [orderId, userId]
    );

    if (result.affectedRows === 0) {
      const [orderRows] = await pool.query(
        `SELECT status FROM orders WHERE id=? AND user_id=?`,
        [orderId, userId]
      );

      if (orderRows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      const currentStatus = orderRows[0].status;
      return res.status(400).json({
        message: `Order cannot be cancelled because its current status is '${currentStatus}'`
      });
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to cancel order", error: err.message });
  }
};

/** ----------------------
 * DASHBOARD TOTALS (ADMIN)
 * ---------------------- */
exports.getDashboardTotals = async (req, res) => {
  try {
    // 1. Today's revenue (include verified GCash orders: 'pending' + completed statuses)
    const [revenueResult] = await pool.query(
      `SELECT IFNULL(SUM(total), 0) AS todayRevenue
       FROM orders
       WHERE DATE(created_at) = CURDATE()
         AND status IN ('pending','paid','preparing','ready','delivered')`
    );

    // 2. Total orders (exclude cancelled)
    const [totalOrdersResult] = await pool.query(
      `SELECT COUNT(*) AS totalOrders
       FROM orders
       WHERE status != 'cancelled'`
    );

    // 3. Pending orders (include verified GCash orders still pending)
    const [pendingOrdersResult] = await pool.query(
      `SELECT COUNT(*) AS pendingOrders
       FROM orders
       WHERE status = 'pending'`
    );

    // 4. Total menu items
    const [totalMenuItemsResult] = await pool.query(
      `SELECT COUNT(*) AS totalMenuItems FROM products`
    );

    // 5. Best-selling item (include verified GCash orders: pending + completed statuses)
    const [bestSellingResult] = await pool.query(
      `SELECT oi.name, SUM(oi.quantity) AS sold
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status IN ('pending','paid','preparing','ready','delivered')
       GROUP BY oi.product_id
       ORDER BY sold DESC
       LIMIT 1`
    );

    res.json({
      todayRevenue: revenueResult[0].todayRevenue,
      totalOrders: totalOrdersResult[0].totalOrders,
      pendingOrders: pendingOrdersResult[0].pendingOrders,
      totalMenuItems: totalMenuItemsResult[0].totalMenuItems,
      bestSelling: bestSellingResult[0] || null,
    });
  } catch (err) {
    console.error("GET DASHBOARD TOTALS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch dashboard totals", error: err.message });
  }
};

// Staff claims an order (assign handled_by)
exports.assignOrderToStaff = async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user?.id;

  if (!staffId) {
    return res.status(401).json({ message: "Staff must be logged in" });
  }

  try {
    // Only assign if no staff has taken this order yet
    const [result] = await pool.query(
      `UPDATE orders
       SET staff_id=?
       WHERE id=? AND (staff_id IS NULL OR staff_id = 0)`,
      [staffId, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Order is already handled by another staff",
      });
    }

    res.json({
      message: "Order assigned successfully",
      orderId,
      staff_id: staffId,
    });
  } catch (err) {
    console.error("ASSIGN ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to assign order", error: err.message });
  }
};
