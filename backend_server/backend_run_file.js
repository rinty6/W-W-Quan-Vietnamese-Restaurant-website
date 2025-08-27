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

app.use('/webhook', webhookRoutes);

// Middlewares
app.use(cors());
app.use(express.json());

// Log all requests (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Proctect /api routes with API key
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

// Stripe payment intent route
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { order, items } = req.body;
    const amount = Math.round(order.total * 100); // Stripe expects cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      payment_method_types: ['card', 'au_becs_debit'],
      receipt_email: order.email,
      metadata: {
        order: JSON.stringify(order),
        items: JSON.stringify(items)
      }
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
