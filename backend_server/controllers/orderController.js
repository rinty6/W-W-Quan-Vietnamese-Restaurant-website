const { createOrder } = require('../models/orderModel');

// Controller to handle saving a new order
const handleNewOrder = async (req, res) => {
  const { order, items } = req.body;

  // ======= Validation Block =======
  if (!order || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing or invalid order or items array' });
  }

  const requiredFields = ['name', 'phone', 'pickup_type', 'datetime', 'subtotal', 'total', 'stripe_payment_id'];
  for (const field of requiredFields) {
    if (!order[field]) {
      return res.status(400).json({ error: `Missing field in order: ${field}` });
    }
  }

  for (const item of items) {
    if (
      typeof item.dish_id === 'undefined' ||
      !item.dish_name ||
      typeof item.dish_price !== 'number' ||
      typeof item.quantity !== 'number'
    ) {
      return res.status(400).json({ error: 'Invalid item structure in items array' });
    }

    if (item.sides && Array.isArray(item.sides)) {
      for (const side of item.sides) {
        if (!side.side_name || typeof side.side_price !== 'number') {
          return res.status(400).json({ error: 'Invalid side structure in item' });
        }
      }
    }
  }
  // ======= End Validation =======

  try {
    const orderId = await createOrder(order, items);
    res.status(200).json({ success: true, orderId });
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { handleNewOrder };
