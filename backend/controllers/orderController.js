const pool = require('../db');

/**
 * Helpers
 */
const now = () => new Date();

const isOnlinePaymentMethod = (method) => {
  // 'gcash' and 'cod' are considered online (COD = cash on delivery)
  return method === 'gcash' || method === 'cod';
};

/** ----------------------
 * CREATE ORDER
 * Handles both online orders (customers) and walk-in created by staff
 * ---------------------- */
exports.createOrder = async (req, res) => {
  const {
    firstName, lastName, phone, address, barangay,
    city, province, postal, gps_lat, gps_lng,
    payment_method = 'cash', gcash_ref,
    subtotal = 0, delivery_fee = 0, tax = 0, total = 0,
    items,
    amount_received = null, // optional: provided by staff for walk-ins or cash confirmations
    order_source // optional: 'online' or 'walkin'; fallback determined below
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

    // Determine order_source:
    const resolvedOrderSource = order_source || (userId ? 'online' : 'walkin');

    // Determine initial statuses and payment status
    let status = 'unverified';
    let payment_status = 'unverified';

    // ----------- UPDATE: Walk-in cash orders -------------
    if (resolvedOrderSource === 'walkin') {
      if (payment_method === 'cash' || payment_method === 'card') {
        if (amount_received !== null && Number(amount_received) >= Number(total)) {
          status = 'pending';
          payment_status = 'paid';
        } else {
          status = 'pending';
          payment_status = payment_method === 'card' ? 'paid' : 'pending';
        }
      } else if (isOnlinePaymentMethod(payment_method)) {
        status = 'unverified';
        payment_status = 'unverified';
      }
    } else {
      if (isOnlinePaymentMethod(payment_method)) {
        status = 'unverified';
        payment_status = 'unverified';
      } else {
        status = 'pending';
        payment_status = 'pending';
      }
    }

    // Compute change if amount_received provided
    let computedChange = null;
    if (amount_received !== null) {
      const amt = Number(amount_received);
      const t = Number(total);
      computedChange = Number((amt - t).toFixed(2));
    }

    const createdAt = now();

    // Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (user_id, firstName, lastName, phone, address, barangay, city, province, postal, gps_lat, gps_lng,
         payment_method, gcash_ref, subtotal, delivery_fee, tax, total, amount_received, change_amount,
         order_source, notified, payment_verified_by, verified_at, items, created_at, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        gps_lat || null,
        gps_lng || null,
        payment_method,
        gcash_ref || null,
        subtotal,
        delivery_fee,
        tax,
        total,
        amount_received !== null ? Number(amount_received) : null,
        computedChange !== null ? computedChange : null,
        resolvedOrderSource,
        0, // notified default 0
        null, // payment_verified_by
        null, // verified_at
        JSON.stringify(items),
        createdAt,
        status,
        payment_status
      ]
    );

    const orderId = orderResult.insertId;

    // insert order items into order_items table
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
      order_source: resolvedOrderSource
    });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
      try { connection.release(); } catch (_) {}
    }
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
};

/** ----------------------
 * GET USER ORDERS
 * ---------------------- */
exports.getUserOrders = async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ message: "User not authenticated" });

  try {
    const [ordersRows] = await pool.query(
      `SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC`,
      [req.user.id]
    );

    const ordersWithItems = await Promise.all(
      ordersRows.map(async order => {
        const [items] = await pool.query(`SELECT * FROM order_items WHERE order_id=?`, [order.id]);
        return { ...order, items };
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
 * ---------------------- */
exports.getOrders = async (req, res) => {
  try {
    const { status, payment_method, payment_status, orderId, onlyNotified } = req.query;
    let query = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (status) { query += " AND status=?"; params.push(status); }
    if (payment_method) { query += " AND payment_method=?"; params.push(payment_method); }
    if (payment_status) { query += " AND payment_status=?"; params.push(payment_status); }
    if (orderId) { query += " AND id=?"; params.push(orderId); }
    if (onlyNotified === '1' || onlyNotified === 'true') { query += " AND notified=0"; }

    query += " ORDER BY created_at DESC";

    const [ordersRows] = await pool.query(query, params);

    const ordersWithItems = await Promise.all(
      ordersRows.map(async order => {
        const [items] = await pool.query(`SELECT * FROM order_items WHERE order_id=?`, [order.id]);
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
      `UPDATE orders SET gcash_ref=?, payment_status='unverified', status='unverified', order_source='online' WHERE id=? AND payment_method='gcash'`,
      [gcash_ref, orderId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found or not a GCash order" });

    res.json({ message: "GCash reference submitted, waiting staff verification." });
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
  const { amount_received = null } = req.body;

  if (!staffId) return res.status(401).json({ message: "Staff must be authenticated to verify payments" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id=? FOR UPDATE`, [orderId]);
    if (rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Order not found" });
    }
    const order = rows[0];

    if (order.payment_status === 'paid') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "Order payment already verified" });
    }

    // Recalculate subtotal and total
    const [itemsRows] = await conn.query(`SELECT price, quantity FROM order_items WHERE order_id=?`, [orderId]);
    const recalculatedSubtotal = itemsRows.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const recalculatedTotal = Number((recalculatedSubtotal + Number(order.delivery_fee) + Number(order.tax)).toFixed(2));

    let changeAmount = null;
    if (amount_received !== null) {
      changeAmount = Number((Number(amount_received) - recalculatedTotal).toFixed(2));
    }

    const verifiedAt = now();
    const [updateResult] = await conn.query(
      `UPDATE orders
       SET payment_status='paid', status='pending', payment_verified_by=?, verified_at=?, 
           amount_received=?, change_amount=?, subtotal=?, total=?
       WHERE id=?`,
      [
        staffId,
        verifiedAt,
        amount_received !== null ? Number(amount_received) : order.amount_received,
        changeAmount,
        recalculatedSubtotal,
        recalculatedTotal,
        orderId
      ]
    );

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ message: "Failed to update order during verification" });
    }

    await conn.commit();
    conn.release();

    res.json({ message: "Payment verified, order marked as pending", orderId, payment_status: 'paid', status: 'pending' });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} try { conn.release(); } catch (_) {} }
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to verify payment", error: err.message });
  }
};

/** ----------------------
 * PAY CASH (STAFF)
 * ---------------------- */
exports.payCash = async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user?.id || null;
  const { amount_received } = req.body;

  if (!staffId) return res.status(401).json({ message: "Staff must be authenticated" });
  if (amount_received === undefined) return res.status(400).json({ message: "amount_received is required" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id=? FOR UPDATE`, [orderId]);
    if (rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Order not found" });
    }
    const order = rows[0];

    if (!(order.payment_method === 'cash' || order.payment_method === 'cod')) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "Order payment method is not cash/cod" });
    }

    // Recalculate subtotal and total
    const [itemsRows] = await conn.query(`SELECT price, quantity FROM order_items WHERE order_id=?`, [orderId]);
    const recalculatedSubtotal = itemsRows.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const recalculatedTotal = Number((recalculatedSubtotal + Number(order.delivery_fee) + Number(order.tax)).toFixed(2));

    const amt = Number(amount_received);
    if (isNaN(amt) || amt < recalculatedTotal) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "Insufficient amount_received" });
    }

    const changeAmount = Number((amt - recalculatedTotal).toFixed(2));
    const verifiedAt = now();

    const [result] = await conn.query(
      `UPDATE orders 
       SET payment_status='paid', status='pending', amount_received=?, change_amount=?, payment_verified_by=?, verified_at=?, subtotal=?, total=? 
       WHERE id=?`,
      [amt, changeAmount, staffId, verifiedAt, recalculatedSubtotal, recalculatedTotal, orderId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ message: "Failed to update order" });
    }

    await conn.commit();
    conn.release();

    res.json({ message: "Cash payment recorded and order is pending", orderId, change_amount: changeAmount });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} try { conn.release(); } catch (_) {} }
    console.error("PAY CASH ERROR:", err);
    res.status(500).json({ message: "Failed to confirm cash payment", error: err.message });
  }
};

/** ----------------------
 * UPDATE ORDER STATUS (STAFF)
 * ---------------------- */
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const validStatuses = ['pending','unverified','paid','preparing','ready','delivered','cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  try {
    const [result] = await pool.query(`UPDATE orders SET status=? WHERE id=?`, [status, orderId]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });

    res.json({ message: `Order status updated to ${status}` });
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
  try {
    const [result] = await pool.query(`UPDATE orders SET notified=1 WHERE id=?`, [orderId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
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
