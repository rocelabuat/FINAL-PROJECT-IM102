const express = require('express');
const router = express.Router();

// ----------------------
// ADMIN CONTROLLER
// ----------------------
const {
  getDashboardTotals,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,

  // Ingredients
  getProductIngredients,
  addProductIngredient,
  deleteProductIngredient,

  // Inventory
  getInventory,
  updateInventoryItem,
  addStock,  // Add the addStock function here

  // Dashboard charts
  getOrderStatusCounts,
  getPaymentCounts,

  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getTopSellingProducts,
  // Sales report
  exportSalesSummary,

  // Auth
  registerStaff,
  registerAdmin,

  // Alerts
  getLowStockAlerts,

  // Orders
  updateOrderStatus,
  
} = require('../controllers/adminController');

// ----------------------
// DASHBOARD
// ----------------------
router.get('/dashboard-totals', getDashboardTotals);
router.get('/status-counts', getOrderStatusCounts);
router.get('/payment-counts', getPaymentCounts);
router.get('/export', exportSalesSummary);

// ----------------------
// MENU MANAGEMENT
// ----------------------
router.get('/menu', getMenuItems);
router.post('/menu', createMenuItem);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

// ----------------------
// PRODUCT INGREDIENT MANAGEMENT
// ----------------------
router.get('/menu/:productId/ingredients', getProductIngredients);
router.post('/menu/:productId/ingredients', addProductIngredient);
router.delete('/menu/ingredients/:ingredientId', deleteProductIngredient);

// ----------------------
// INVENTORY MANAGEMENT
// ----------------------
router.get('/inventory', getInventory);
router.put('/inventory/:id', updateInventoryItem);
router.put('/inventory/:id/add-stock', addStock);  // New route for adding stock
router.get('/low-stock-alerts-admin', getLowStockAlerts);

// ----------------------
// ORDER STATUS (auto-deduct trigger)
// ----------------------
router.put('/orders/:id/status', updateOrderStatus);

// ----------------------
// STAFF & ADMIN REGISTRATION
// ----------------------
router.post('/register-staff', registerStaff);
router.post('/register-admin', registerAdmin);

router.get('/sales/daily', getDailyRevenue);
router.get('/sales/weekly', getWeeklyRevenue);
router.get('/sales/monthly', getMonthlyRevenue);
router.get('/sales/top-products', getTopSellingProducts);

module.exports = router;
