const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOrderEmail(order, items, paymentStatus = 'succeeded') {
  const ownerEmail = process.env.OWNER_EMAIL;
  let customerEmail = order.email || null;

  // Fallback: If order.email is missing, try to use Stripe's receipt_email
  if (!customerEmail && order.stripe_receipt_email) {
    customerEmail = order.stripe_receipt_email;
  }

  const itemsList = items.map(item => {
    const sides = (item.sides || []).map(s => `- ${s.side_name || s.name} ($${s.side_price || s.price})`).join('<br>');
    return `<li>
              <strong>${item.quantity} x ${item.dish_name || item.name}</strong> - $${item.dish_price || item.dishPrice}<br>
              ${sides}
            </li>`;
  }).join('');

  // Calculate base amount if not provided
  const baseAmount = order.base_amount || order.subtotal || 0;
  const surcharge = order.surcharge || 0;
  const surchargeRate = order.surcharge_rate || 0;
  const paymentMethodType = order.payment_method_type || 'card';
  const totalWithSurcharge = order.total_with_surcharge || order.total || 0;

  const htmlContent = `
    <h2>Order ${paymentStatus === 'succeeded' ? 'Confirmation' : 'Status Update'}</h2>
    <p><strong>Payment Status:</strong> ${paymentStatus}</p>
    <p><strong>Name:</strong> ${order.name || 'N/A'}</p>
    <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
    ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
    <p><strong>Pickup Type:</strong> ${order.pickup_type || 'N/A'}</p>
    <p><strong>Date/Time:</strong> ${order.datetime || 'N/A'}</p>
    <p><strong>Note:</strong> ${order.note || 'N/A'}</p>
    
    <h3>Items:</h3>
    <ul>${itemsList}</ul>
    
    <hr style="border: 1px solid #ddd; margin: 20px 0;">
    
    <h3>Payment Summary:</h3>
    <p><strong>Subtotal:</strong> $${parseFloat(baseAmount).toFixed(2)}</p>
    ${surcharge > 0 ? `
      <p><strong>Payment Method:</strong> ${paymentMethodType === 'au_becs_debit' ? 'Australian BECS Direct Debit' : 'Credit/Debit Card'}</p>
      <p><strong>Processing Fee (${surchargeRate}%):</strong> $${parseFloat(surcharge).toFixed(2)}</p>
    ` : ''}
    <p style="font-size: 1.2em;"><strong>Total Paid:</strong> $${parseFloat(totalWithSurcharge).toFixed(2)}</p>
    
    <hr style="border: 1px solid #ddd; margin: 20px 0;">
    
    <p><strong>Payment ID:</strong> ${order.stripe_payment_id || 'N/A'}</p>
    
    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
      <p style="margin: 0; font-size: 0.9em; color: #666;">
        ${surcharge > 0 ? `A processing fee of ${surchargeRate}% was applied to cover transaction costs. ` : ''}
        Thank you for your order at W&W Quan!
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"W&W Quan Orders" <${process.env.EMAIL_USER}>`,
    to: ownerEmail,
    bcc: customerEmail || undefined,
    subject: `Order ${paymentStatus === 'succeeded' ? 'Confirmation' : 'Status Update'} - ${order.name || 'Customer'}`,
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOrderEmail };