const express = require('express');
const router = express.Router();
const { handleNewOrder } = require('../controllers/orderController');

// Route: POST /api/save-order
router.post('/save-order', handleNewOrder);

module.exports = router;
