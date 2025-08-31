import { useState, useEffect, useCallback } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import './CheckoutForm.css';

const CheckoutForm = ({ subtotal, surchargeRates, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [currentSurcharge, setCurrentSurcharge] = useState(0);
  const [totalWithSurcharge, setTotalWithSurcharge] = useState(subtotal);
  const navigate = useNavigate();

  // Update display elements - moved outside useEffect and memoized
  const updatePaymentDisplay = useCallback((surcharge, total, rate) => {
    const surchargeDisplay = document.getElementById('surcharge-display');
    if (surchargeDisplay) {
      surchargeDisplay.innerHTML = `<strong>Processing Fee (${rate}%):</strong> <span class="surcharge-amount">A${surcharge.toFixed(2)}</span>`;
    }
    const totalDisplay = document.getElementById('total-display');
    if (totalDisplay) {
      totalDisplay.textContent = `A${total.toFixed(2)}`;
    }
    const checkoutBtn = document.querySelector('.checkout-btn-dynamic');
    if (checkoutBtn && !loading) {
      checkoutBtn.textContent = `Pay A${total.toFixed(2)}`;
    }
  }, [loading]);

  // Function to update backend payment intent amount with error handling
  const updatePaymentIntentAmount = useCallback(async (paymentMethod) => {
    if (!clientSecret) return;
    const paymentIntentId = clientSecret.split('_secret_')[0];
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/update-payment-intent-amount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethod
        })
      });

      // Defensive: Only parse JSON if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        await response.json();
        console.log('Payment intent amount updated for method:', paymentMethod);
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
      }
    } catch (error) {
      if (error.message && error.message.includes('processing')) {
        console.warn('PaymentIntent update failed - payment is processing. This is normal.');
      } else {
        console.error('Error updating payment intent:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [clientSecret]);

  useEffect(() => {
    if (!elements) return;
    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) return;

    const handleChange = (event) => {
      if (event.value && event.value.type) {
        let surchargeRate = surchargeRates.card || 1.5;
        let paymentMethodType = 'card';
        if (event.value.type === 'au_becs_debit') {
          surchargeRate = surchargeRates.au_becs_debit || 0.5;
          paymentMethodType = 'au_becs_debit';
        } else if (event.value.type === 'card') {
          surchargeRate = surchargeRates.card || 1.5;
          paymentMethodType = 'card';
        }
        const surcharge = subtotal * (surchargeRate / 100);
        setCurrentSurcharge(surcharge);
        setTotalWithSurcharge(subtotal + surcharge);
        updatePaymentDisplay(surcharge, subtotal + surcharge, surchargeRate);
        setTimeout(() => {
          updatePaymentIntentAmount(paymentMethodType);
        }, 100);
      }
    };

    paymentElement.on('change', handleChange);

    // Set initial values for card payment
    const initialSurcharge = subtotal * ((surchargeRates.card || 1.5) / 100);
    setCurrentSurcharge(initialSurcharge);
    setTotalWithSurcharge(subtotal + initialSurcharge);
    updatePaymentDisplay(initialSurcharge, subtotal + initialSurcharge, surchargeRates.card || 1.5);
    setTimeout(() => {
      updatePaymentIntentAmount('card');
    }, 500);

    return () => {
      paymentElement.off('change', handleChange);
    };
  }, [elements, subtotal, surchargeRates, updatePaymentDisplay, updatePaymentIntentAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage('');
    setStatusType('');
    const checkoutBtn = document.querySelector('.checkout-btn-dynamic');
    if (checkoutBtn) {
      checkoutBtn.textContent = 'Processing...';
    }
    if (!stripe || !elements) {
      setLoading(false);
      return;
    }
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'AU',
              }
            }
          }
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message);
        setStatusType('error');
        setLoading(false);
        if (checkoutBtn) {
          checkoutBtn.textContent = `Pay A$${totalWithSurcharge.toFixed(2)}`;
        }
      } else if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            localStorage.setItem('paymentStatus', 'success');
            localStorage.setItem('paymentSurcharge', currentSurcharge.toString());
            localStorage.setItem('paymentTotal', totalWithSurcharge.toString());
            setTimeout(() => {
              navigate('/', {
                state: {
                  paymentSuccess: true,
                  surcharge: currentSurcharge,
                  totalWithSurcharge: totalWithSurcharge
                }
              });
            }, 100);
            break;
          case 'processing':
            localStorage.setItem('paymentStatus', 'processing');
            localStorage.setItem('paymentSurcharge', currentSurcharge.toString());
            localStorage.setItem('paymentTotal', totalWithSurcharge.toString());
            setTimeout(() => {
              navigate('/', {
                state: {
                  paymentProcessing: true,
                  surcharge: currentSurcharge,
                  totalWithSurcharge: totalWithSurcharge
                }
              });
            }, 100);
            break;
          case 'requires_action':
            setStatusMessage('Your payment requires additional action.');
            setStatusType('error');
            setLoading(false);
            if (checkoutBtn) {
              checkoutBtn.textContent = `Pay A$${totalWithSurcharge.toFixed(2)}`;
            }
            break;
          default:
            setStatusMessage('Payment status: ' + paymentIntent.status);
            setStatusType('error');
            setLoading(false);
            if (checkoutBtn) {
              checkoutBtn.textContent = `Pay A$${totalWithSurcharge.toFixed(2)}`;
            }
        }
      } else {
        setStatusMessage('No payment intent returned. Please try again.');
        setStatusType('error');
        setLoading(false);
        if (checkoutBtn) {
          checkoutBtn.textContent = `Pay A$${totalWithSurcharge.toFixed(2)}`;
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during payment');
      setLoading(false);
      if (checkoutBtn) {
        checkoutBtn.textContent = `Pay A$${totalWithSurcharge.toFixed(2)}`;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="payment-element-container">
        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: false
            },
            paymentMethodOrder: ['card', 'au_becs_debit'],
            fields: {
              billingDetails: {
                address: 'auto'
              }
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never'
            }
          }}
        />
      </div>
      <div className="checkout-final-amount">
        <p className="checkout-amount-text">
          Total Amount to Pay: <strong>A${totalWithSurcharge.toFixed(2)}</strong>
          {currentSurcharge > 0 && (
            <span className="checkout-surcharge-info">
              (includes A${currentSurcharge.toFixed(2)} processing fee)
            </span>
          )}
        </p>
      </div>
      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="checkout-btn checkout-btn-dynamic"
      >
        {loading ? 'Processing...' : `Pay A${totalWithSurcharge.toFixed(2)}`}
      </button>
      {error && (
        <div className="payment-status-message error">{error}</div>
      )}
      {statusMessage && (
        <div className={`payment-status-message${statusType ? ' ' + statusType : ''}`}>
          {statusMessage}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;