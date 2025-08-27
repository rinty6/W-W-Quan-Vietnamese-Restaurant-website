require('dotenv').config();
const express = require("express");
const Stripe = require('stripe');
const cors = require('cors');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
});

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

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

  // Calculate amounts in cents - we'll use the higher surcharge rate (card) for initial amount
  const baseAmountCents = Math.round(baseAmount * 100);
  const maxSurchargeRate = Math.max(...Object.values(SURCHARGE_RATES));
  const maxSurchargeAmountCents = Math.round(baseAmountCents * (maxSurchargeRate / 100));
  const maxTotalAmountCents = baseAmountCents + maxSurchargeAmountCents;

  if (maxTotalAmountCents < 50) {
    return res.status(400).send({ error: "Order total is too low.", items });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: maxTotalAmountCents, // Use max amount initially
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: {
        name: order.name || 'Unknown',
        phone: order.phone || 'Unknown',
        email: order.email || 'Unknown',
        summary: `Items: ${items.length}`,
        base_amount_cents: baseAmountCents.toString(),
        base_amount_dollars: baseAmount.toFixed(2),
        // Store pre-calculated amounts for different payment methods
        total_with_card_surcharge: calculateTotalWithSurcharge(baseAmountCents, 'card').toString(),
        total_with_becs_surcharge: calculateTotalWithSurcharge(baseAmountCents, 'au_becs_debit').toString(),
        card_surcharge_cents: calculateSurcharge(baseAmountCents, 'card').toString(),
        becs_surcharge_cents: calculateSurcharge(baseAmountCents, 'au_becs_debit').toString(),
        pickup_type: order.pickup_type || order.pickupType || 'pickup',
        datetime: order.datetime || 'Not specified',
        note: order.note || 'No note',
        items_data: JSON.stringify(items) // Store items data for webhook
      }
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      baseAmount: baseAmount,
      surchargeRates: SURCHARGE_RATES
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

// Endpoint to update payment intent amount based on selected payment method
app.post("/update-payment-intent-amount", async (req, res) => {
  try {
    const { paymentIntentId, paymentMethod } = req.body;
   
    // Retrieve the existing payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Check if PaymentIntent can be updated
    const updatableStatuses = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
    
    if (!updatableStatuses.includes(paymentIntent.status)) {
      console.log(`PaymentIntent ${paymentIntentId} has status: ${paymentIntent.status}. Cannot update amount. This is expected behavior when payment is processing.`);
      
      // Return success response since this is not actually an error condition
      return res.send({
        success: true,
        message: `Payment is ${paymentIntent.status}. Amount update not needed.`,
        status: paymentIntent.status
      });
    }
    
    const baseAmountCents = parseInt(paymentIntent.metadata.base_amount_cents);
   
    // Calculate new total with appropriate surcharge
    const newTotalAmountCents = calculateTotalWithSurcharge(baseAmountCents, paymentMethod);
   
    // Update the payment intent amount
    const updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: newTotalAmountCents,
      metadata: {
        ...paymentIntent.metadata,
        final_payment_method: paymentMethod,
        final_amount_cents: newTotalAmountCents.toString(),
        final_surcharge_cents: calculateSurcharge(baseAmountCents, paymentMethod).toString()
      }
    });
   
    res.send({
      success: true,
      amount: newTotalAmountCents,
      surcharge: calculateSurcharge(baseAmountCents, paymentMethod),
      status: updatedPaymentIntent.status
    });
    
  } catch (err) {
    console.error('Error updating payment intent:', err);
    
    // Check if it's specifically the "status of processing" error
    if (err.type === 'StripeInvalidRequestError' && err.message.includes('status of processing')) {
      console.log('PaymentIntent is processing - this is expected behavior, not an error.');
      return res.send({
        success: true,
        message: 'Payment is processing. Amount update not needed.',
        status: 'processing'
      });
    }
    
    // For other errors, return error response
    res.status(500).send({ error: err.message });
  }
});

// New endpoint to get surcharge rates
app.get("/surcharge-rates", (req, res) => {
  res.json(SURCHARGE_RATES);
});

const webhookRoutes = require('../../backend_server/routes/webhookRoutes');
app.use('/webhook', webhookRoutes);

app.listen(4242, () => console.log("Stripe server running on port 4242"));