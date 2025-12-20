const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");

router.get("/products", productController.getProductStock);

module.exports = router;
