const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const { createOrder } = require('../models/orderModel');
const { sendOrderEmail } = require('../utils/emailService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Webhook handler triggered');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata;

    console.log('Payment Intent Metadata:', metadata);

    if (metadata && metadata.name && metadata.items_data) {
      try {
        // Parse items data
        const items = JSON.parse(metadata.items_data);
        console.log('Parsed items:', items);

        // Calculate the correct total based on final payment method and amount
        const finalAmountCents = parseInt(metadata.final_amount_cents) || paymentIntent.amount;
        const finalAmountDollars = finalAmountCents / 100;
        
        const baseAmountCents = parseInt(metadata.base_amount_cents);
        const baseAmountDollars = parseFloat(metadata.base_amount_dollars);
        
        const finalSurchargeCents = parseInt(metadata.final_surcharge_cents) || 0;
        const finalSurchargeDollars = finalSurchargeCents / 100;

        // Construct order object with correct amounts
        const order = {
          name: metadata.name,
          phone: metadata.phone,
          email: metadata.email,
          note: metadata.note,
          pickup_type: metadata.pickup_type,
          datetime: metadata.datetime,
          subtotal: baseAmountDollars, // Original subtotal without surcharge
          surcharge_amount: finalSurchargeDollars, // Actual surcharge applied
          total: finalAmountDollars, // Final total with surcharge
          payment_method: metadata.final_payment_method || 'card',
          stripe_payment_id: paymentIntent.id,
          payment_status: 'succeeded'
        };

        console.log('Order object to save:', order);

        // Save order to database
        const orderId = await createOrder(order, items);
        console.log('Order saved from webhook, ID:', orderId);

        // Send order confirmation email
        await sendOrderEmail(order, items, 'succeeded');
        console.log('Order email sent to owner and customer.');

      } catch (err) {
        console.error('Error processing webhook order:', err.stack);
        
        // Still respond with 200 to acknowledge receipt, but log the error
        console.error('Webhook processing failed but acknowledged');
      }
    } else {
      console.warn('Incomplete metadata found in paymentIntent. Required fields missing.');
      console.warn('Available metadata:', metadata);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata;

    console.log('Payment failed for intent:', paymentIntent.id);

    if (metadata && metadata.email) {
      try {
        // Optionally send failure notification
        const order = {
          name: metadata.name || 'Customer',
          phone: metadata.phone,
          email: metadata.email,
          stripe_payment_id: paymentIntent.id,
          payment_status: 'failed'
        };

        const items = metadata.items_data ? JSON.parse(metadata.items_data) : [];

        await sendOrderEmail(order, items, 'failed');
        console.log('Payment failure email sent.');
      } catch (err) {
        console.error('Error sending payment failure email:', err.message);
      }
    }
  } else {
    console.log('Unhandled event type:', event.type);
  }

  res.status(200).send('Webhook received');
});

module.exports = router;