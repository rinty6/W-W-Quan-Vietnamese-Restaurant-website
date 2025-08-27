import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import logo from "../assets/image/Restaurant Logo.png";
import "./PaymentPage.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoice = location.state?.invoice;
  const [clientSecret, setClientSecret] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [surchargeRates, setSurchargeRates] = useState({
    card: 1.5,
    au_becs_debit: 0.5
  });

  useEffect(() => {
    if (!invoice) return;

    // Calculate subtotal
    let sub = 0;
    invoice.items.forEach(item => {
      const qty = item.quantity || item.qty || 1;
      const dishPrice = typeof item.dishPrice === "number" ? item.dishPrice : 0;
      const sidesTotal = (item.sides || []).reduce((s, side) => s + (typeof side.price === "number" ? side.price : 0), 0);
      sub += (dishPrice + sidesTotal) * qty;
    });

    setSubtotal(sub);

    // Set initial total display with card surcharge (default)
    const initialSurcharge = sub * (1.5 / 100); // Default card rate
    const initialTotal = sub + initialSurcharge;
    
    // Update initial display
    setTimeout(() => {
      const surchargeDisplay = document.getElementById('surcharge-display');
      if (surchargeDisplay) {
        surchargeDisplay.innerHTML = `<strong>Processing Fee (1.5%):</strong> <span class="surcharge-amount">A$${initialSurcharge.toFixed(2)}</span>`;
      }
      
      const totalDisplay = document.getElementById('total-display');
      if (totalDisplay) {
        totalDisplay.textContent = `A$${initialTotal.toFixed(2)}`;
      }
    }, 100);

  }, [invoice]);

  // Create PaymentIntent after email is entered
  useEffect(() => {
    if (!invoice || !customerEmail) return;

    fetch('http://localhost:4242/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          name: invoice.name,
          phone: invoice.phone,
          email: customerEmail,
          note: invoice.note,
          pickup_type: invoice.pickupType,
          datetime: invoice.datetime,
          subtotal: subtotal,
          total: invoice.total
        },
        items: invoice.items
      })
    })
      .then(res => res.json())
      .then(data => {
        setClientSecret(data.clientSecret);
        if (data.surchargeRates) {
          setSurchargeRates(data.surchargeRates);
        }
      })
      .catch(() => setClientSecret("error"));
  }, [invoice, customerEmail, subtotal]);

  if (!invoice) return <div style={{ fontFamily: "inherit" }}>No invoice data.</div>;
  if (clientSecret === "error") return <div style={{ fontFamily: "inherit" }}>Payment error. Please try again or contact us.</div>;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#FFD600',
        colorText: '#000000',
        colorTextSecondary: '#000000',
        colorTextPlaceholder: '#666666',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        borderRadius: '8px',
      },
      rules: {
        '.Label': {
          color: '#000000',
          fontWeight: '600',
        },
        '.Input': {
          backgroundColor: '#f9f9f9',
          color: '#000000',
        },
        '.Tab': {
          color: '#000000',
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
        },
        '.Tab--selected': {
          backgroundColor: '#FFD600',
          color: '#000000',
          borderColor: '#FFD600',
        },
        '.TabLabel': {
          color: '#000000',
        },
        '.Block': {
          backgroundColor: '#ffffff',
          boxShadow: 'none',
          borderRadius: '8px',
        }
      }
    }
  };

  return (
    <div className="payment-bg" style={{ fontFamily: "inherit" }}>
      <div className="payment-container" style={{ fontFamily: "inherit" }}>
        <div className="payment-header">
          <div className="payment-logo-row">
            <Link to="/">
              <img src={logo} alt="W&W Quan Logo" className="payment-logo" />
            </Link>
          </div>
          <div className="payment-title-row">
            <span className="payment-title">W&W Quan</span>
            <button className="menu-btn" onClick={() => navigate("/menu")}>Back to Menu</button>
          </div>
        </div>
        <h1 className="payment-title">Payment</h1>
        <div className="payment-content-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="payment-details-col" style={{ flex: '1 1 300px' }}>
            <div className="payment-summary">
              <p><strong>Name:</strong> {invoice.name}</p>
              <p><strong>Phone:</strong> {invoice.phone}</p>
              <p><strong>Note:</strong> {invoice.note}</p>
              <p><strong>Pick up type:</strong> {invoice.pickupType}</p>
              <p><strong>Date/Time:</strong> {invoice.datetime}</p>
              <p><strong>Total items:</strong> {invoice.items.length}</p>
              <div className="payment-totals">
                <p><strong>Subtotal:</strong> A${subtotal.toFixed(2)}</p>
                <p className="surcharge-line" id="surcharge-display">
                  <strong>Processing Fee:</strong>
                  <span className="surcharge-amount"> Calculated at checkout</span>
                </p>
                <p className="total-line">
                  <strong>Total: </strong>
                  <span className="total-amount" id="total-display"> A${subtotal.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <ul className="payment-items" style={{ listStyle: "none", padding: 0, fontFamily: "inherit", maxWidth: 420 }}>
              {invoice.items.map((item, idx) => {
                const qty = item.quantity || item.qty || 1;
                const dishPrice = typeof item.dishPrice === "number" ? item.dishPrice : 0;
                const sidesTotal = (item.sides || []).reduce((s, side) => s + (typeof side.price === "number" ? side.price : 0), 0);
                const totalItemPrice = (dishPrice + sidesTotal) * qty;

                return (
                  <li key={idx} style={{ marginBottom: 4, fontFamily: "inherit" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center" }}>
                      <span style={{ minWidth: 32 }}>× {qty}</span>
                      <span style={{ paddingRight: 8 }}>{item.name}</span>
                      <span style={{ minWidth: 70, textAlign: "right" }}>A${totalItemPrice.toFixed(2)}</span>
                    </div>
                    {item.sides && item.sides.length > 0 && item.sides.map((side, sidx) => (
                      <div
                        key={sidx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "32px 1fr auto",
                          alignItems: "center",
                          fontSize: "0.95em",
                          color: "#444",
                          fontFamily: "inherit"
                        }}
                      >
                        <span></span>
                        <span style={{ paddingLeft: 8 }}>{side.name}</span>
                        <span style={{ minWidth: 70, textAlign: "right" }}>
                          A${typeof side.price === "number" ? (side.price * qty).toFixed(2) : "0.00"}
                        </span>
                      </div>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="checkout-section-col" style={{ flex: '1 1 300px' }}>
            {/* Surcharge Notice */}
            <div className="surcharge-notice">
              <p className="surcharge-notice-text">
                <svg className="info-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7v-5h2v5zm0-6H7V4h2v2z"/>
                </svg>
                A processing fee applies to cover transaction costs: 1.5% for Credit/Debit Card payments and 0.5% for Australian BECS Direct Debit. The fee will be calculated based on your selected payment method below.
              </p>
            </div>

            <div>
              <label htmlFor="customerEmail" className='email-input'>Email</label>
              <input
                type="email"
                id="customerEmail"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  setEmailTouched(true);
                }}
                placeholder="Enter your email"
                style={{ width: '96%', padding: '8px', marginBottom: '2px', borderRadius: '10px', marginTop: '10px' }}
                required
              />
              {emailTouched && !customerEmail && (
                <div style={{ color: "#b71c1c", fontSize: "0.95rem", marginBottom: '8px', fontFamily: "inherit", marginTop: '4px' }}>
                  Please enter your email to proceed.
                </div>
              )}
              <p style={{ fontSize: '0.9rem', color: '#555' }}>
                The payment status will be sent to this email address.
              </p>
            </div>

            {clientSecret ? (
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm
                  subtotal={subtotal}
                  surchargeRates={surchargeRates}
                  clientSecret={clientSecret}
                />
              </Elements>
            ) : (
              <button
                className="checkout-btn"
                style={{
                  width: "100%",
                  background: "#FFD600",
                  color: "#222",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 0",
                  marginTop: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
                disabled={!customerEmail}
                onClick={() => setEmailTouched(true)}
              >
                {customerEmail ? "Loading payment..." : "Enter your email to pay"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;