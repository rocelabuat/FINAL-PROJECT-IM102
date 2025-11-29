const express = require('express');
const router = express.Router();
const { getInventory, updateStock } = require('../controllers/inventoryController');

router.get('/', getInventory);
router.put('/:id', updateStock);

module.exports = router;
