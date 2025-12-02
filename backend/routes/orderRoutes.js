const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isStaff, isAdmin } = require('../middleware/roleMiddleware');


const {
  createOrder,
  getUserOrders,
  getOrders,
  submitGcashReference,
  verifyPayment,
  updateOrderStatus,
  markOrderNotified,
  cancelOrder,
  assignOrderToStaff,   // ✅ ADD THIS
} = require('../controllers/orderController');

/** ----------------------
 * CUSTOMER ROUTES
 * ---------------------- */

// Create order (customer or walk-in)
router.post('/', authMiddleware, createOrder);

// Get logged-in user's orders
router.get('/my', authMiddleware, getUserOrders);

// Submit GCash reference (customer)
router.put('/gcash/:id', authMiddleware, submitGcashReference);

// Cancel order (only if pending, unverified, or preparing)
router.put('/cancel/:id', authMiddleware, cancelOrder);

/** ----------------------
 * STAFF / ADMIN ROUTES
 * ---------------------- */

// Fetch all orders (staff/admin)
router.get('/', authMiddleware, isStaff, getOrders);

// Staff verifies GCash or COD payment
router.put('/verify-payment/:id', authMiddleware, isStaff, verifyPayment);

// Update order status (staff can mark as preparing, ready, delivered, etc.)
router.put('/:id/status', authMiddleware, isStaff, updateOrderStatus);

// Mark order as notified (after frontend shows toast)
router.put('/:id/notified', authMiddleware, isStaff, markOrderNotified);

// Staff claims an order — prevents other staff from handling it
router.put('/assign/:id', authMiddleware, isStaff, assignOrderToStaff);



module.exports = router;
