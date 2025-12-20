const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { isStaff, isAdmin } = require('../middleware/roleMiddleware');

const {
  // Customer actions
  createOrder,
  getUserOrders,
  submitGcashReference,
  cancelOrder,

  // Staff/Admin actions
  getOrders,
  verifyPayment,
  updateOrderStatus,
  markOrderNotified,
  assignOrderToStaff,

  // Dashboard analytics
  getDashboardRevenue,
  getTopProducts,
  getOrderStatusCounts,
  getPaymentCounts,
  
} = require('../controllers/orderController');


/* ============================================================
 * ADMIN DASHBOARD ANALYTICS  (placed first to avoid ID conflicts)
 * ============================================================ */
router.get('/dashboard-revenue', authMiddleware, isAdmin, getDashboardRevenue);
router.get('/top-products', authMiddleware, isAdmin, getTopProducts);
router.get('/status-counts', authMiddleware, isAdmin, getOrderStatusCounts);
router.get('/payment-counts', authMiddleware, isAdmin, getPaymentCounts);


/* ============================================================
 * STAFF / ADMIN ROUTES
 * ============================================================ */

// Fetch all orders
router.get('/', authMiddleware, isStaff, getOrders);

// Verify GCash or COD payment
router.put('/verify-payment/:id', authMiddleware, isStaff, verifyPayment);

// Assign order to staff
router.put('/assign/:id', authMiddleware, isStaff, assignOrderToStaff);

// Update order status (preparing → ready → delivered)
router.put('/:id/status', authMiddleware, isStaff, updateOrderStatus);

// Mark order as notified
router.put('/:id/notified', authMiddleware, isStaff, markOrderNotified);


/* ============================================================
 * CUSTOMER ROUTES
 * ============================================================ */

// Create an order
router.post('/', authMiddleware, createOrder);

// Get logged-in user's orders
router.get('/my', authMiddleware, getUserOrders);

// Submit GCash reference
router.put('/gcash/:id', authMiddleware, submitGcashReference);

// Cancel an order
router.put('/cancel/:id', authMiddleware, cancelOrder);




module.exports = router;
