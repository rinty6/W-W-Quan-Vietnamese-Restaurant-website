require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const rateLimit = require('express-rate-limit'); 

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

// Surcharge rates (as percentages)
const SURCHARGE_RATES = {
  card: 1.5, // 1.5% for card payments
  au_becs_debit: 0.5 // 0.5% for BECS Direct Debit
};

// Calculate surcharge based on payment method
function calculateSurcharge(amount, paymentMethod) {
  const rate = SURCHARGE_RATES[paymentMethod] || 0;
  return Math.round(amount * (rate / 100)); // Return in cents
}

// Helper function to calculate total with surcharge for a given payment method
function calculateTotalWithSurcharge(baseAmountCents, paymentMethod) {
  const surchargeAmount = calculateSurcharge(baseAmountCents, paymentMethod);
  return baseAmountCents + surchargeAmount;
}

// Middlewares
app.use(cors({
  origin: [
    'https://w-w-quan-vietnamese-restaurant-webs.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Log all requests (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Protect /api routes with API key
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api', apiLimiter);

// Mount your custom order-saving routes
app.use('/api', orderRoutes); 
console.log('API routes mounted at /api');

// Stripe payment intent route (merged logic)
app.post("/create-payment-intent", async (req, res) => {
  const { items, order } = req.body;
  console.log('Received items:', JSON.stringify(items, null, 2));

  let baseAmount = 0;
  items.forEach(item => {
    const qty = item.quantity || item.qty || 1;
    const dishPrice = typeof item.dishPrice === "number" ? item.dishPrice : 0;
    baseAmount += dishPrice * qty;

    if (item.sides && Array.isArray(item.sides)) {
      item.sides.forEach(side => {
        baseAmount += (typeof side.price === "number" ? side.price : 0) * qty;
      });
    }
  });

  console.log('Base amount:', baseAmount);

  const baseAmountCents = Math.round(baseAmount * 100);
  const maxSurchargeRate = Math.max(...Object.values(SURCHARGE_RATES));
  const maxSurchargeAmountCents = Math.round(baseAmountCents * (maxSurchargeRate / 100));
  const maxTotalAmountCents = baseAmountCents + maxSurchargeAmountCents;

  if (maxTotalAmountCents < 50) {
    return res.status(400).json({ error: "Order total is too low.", items });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: maxTotalAmountCents,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      receipt_email: order.email,
      metadata: {
        name: order.name || 'Unknown',
        phone: order.phone || 'Unknown',
        email: order.email || 'Unknown',
        summary: `Items: ${items.length}`,
        base_amount_cents: baseAmountCents.toString(),
        base_amount_dollars: baseAmount.toFixed(2),
        total_with_card_surcharge: calculateTotalWithSurcharge(baseAmountCents, 'card').toString(),
        total_with_becs_surcharge: calculateTotalWithSurcharge(baseAmountCents, 'au_becs_debit').toString(),
        card_surcharge_cents: calculateSurcharge(baseAmountCents, 'card').toString(),
        becs_surcharge_cents: calculateSurcharge(baseAmountCents, 'au_becs_debit').toString(),
        pickup_type: order.pickup_type || order.pickupType || 'pickup',
        datetime: order.datetime || 'Not specified',
        note: order.note || 'No note',
        items_data: JSON.stringify(items)
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      baseAmount: baseAmount,
      surchargeRates: SURCHARGE_RATES
    });
  } catch (err) {
    console.error('Stripe Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to update payment intent amount based on selected payment method
app.post("/api/update-payment-intent-amount", async (req, res) => {
  try {
    const { paymentIntentId, paymentMethod } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const updatableStatuses = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
    if (!updatableStatuses.includes(paymentIntent.status)) {
      return res.json({
        success: true,
        message: `Payment is ${paymentIntent.status}. Amount update not needed.`,
        status: paymentIntent.status
      });
    }
    const baseAmountCents = parseInt(paymentIntent.metadata.base_amount_cents);
    const newTotalAmountCents = calculateTotalWithSurcharge(baseAmountCents, paymentMethod);
    const updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: newTotalAmountCents,
      metadata: {
        ...paymentIntent.metadata,
        final_payment_method: paymentMethod,
        final_amount_cents: newTotalAmountCents.toString(),
        final_surcharge_cents: calculateSurcharge(baseAmountCents, paymentMethod).toString()
      }
    });
    res.json({
      success: true,
      amount: newTotalAmountCents,
      surcharge: calculateSurcharge(baseAmountCents, paymentMethod),
      status: updatedPaymentIntent.status
    });
  } catch (err) {
    console.error('Error updating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get surcharge rates
app.get("/surcharge-rates", (req, res) => {
  res.json(SURCHARGE_RATES);
});

// Mount webhook routes
app.use('/webhook', webhookRoutes);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});