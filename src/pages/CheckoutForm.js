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
  const [isUpdatingPaymentIntent, setIsUpdatingPaymentIntent] = useState(false);
  const navigate = useNavigate();

  // Update display elements - moved outside useEffect and memoized
  const updatePaymentDisplay = useCallback((surcharge, total, rate) => {
    // Update surcharge display
    const surchargeDisplay = document.getElementById('surcharge-display');
    if (surchargeDisplay) {
      surchargeDisplay.innerHTML = `<strong>Processing Fee (${rate}%):</strong> <span class="surcharge-amount">A${surcharge.toFixed(2)}</span>`;
    }
   
    // Update total display
    const totalDisplay = document.getElementById('total-display');
    if (totalDisplay) {
      totalDisplay.textContent = `A${total.toFixed(2)}`;
    }
   
    // Update button text
    const checkoutBtn = document.querySelector('.checkout-btn-dynamic');
    if (checkoutBtn && !loading) {
      checkoutBtn.textContent = `Pay A${total.toFixed(2)}`;
    }
  }, [loading]);

  // Function to update backend payment intent amount with error handling
  const updatePaymentIntentAmount = useCallback(async (paymentMethod) => {
    if (!clientSecret) return;
   
    // Extract payment intent ID from client secret
    const paymentIntentId = clientSecret.split('_secret_')[0];
   
    setIsUpdatingPaymentIntent(true);
   
    try {
      const response = await fetch('https://w-w-quan-vietnamese-restaurant-website.onrender.com/update-payment-intent-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethod
        })
      });
     
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a Stripe error about PaymentIntent status
        if (errorData.error && errorData.error.includes('status of processing')) {
          console.warn('PaymentIntent is already processing, cannot update amount. This is expected behavior.');
          // Don't treat this as an error since payment is proceeding normally
          return;
        }
        
        console.error('Failed to update payment intent amount:', errorData.error);
      } else {
        const data = await response.json();
        console.log('Payment intent amount updated for method:', paymentMethod);
      }
    } catch (error) {
      // Check if it's a network error or Stripe processing status error
      if (error.message && error.message.includes('processing')) {
        console.warn('PaymentIntent update failed - payment is processing. This is normal.');
      } else {
        console.error('Error updating payment intent:', error);
      }
    } finally {
      // Always reset the updating state
      setIsUpdatingPaymentIntent(false);
    }
  }, [clientSecret]);

  // Listen for payment method changes
  useEffect(() => {
    if (!elements) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) return;

    // Listen for changes in payment method selection
    const handleChange = (event) => {
      if (event.value && event.value.type) {
        let surchargeRate = surchargeRates.card || 1.5; // default
        let paymentMethodType = 'card';
       
        // Detect payment method type
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
       
        // Update display elements
        updatePaymentDisplay(surcharge, subtotal + surcharge, surchargeRate);
       
        // Update backend payment intent amount (with better error handling)
        // Use setTimeout to avoid blocking the UI
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
   
    // Update backend for initial card payment method (with delay)
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

    // Update button text to processing
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
                country: 'AU', // Default to Australia
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
        console.log('Payment Intent Status:', paymentIntent.status);
       
        switch (paymentIntent.status) {
          case 'succeeded':
            console.log('Payment succeeded, navigating to home');
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
            console.log('Payment processing, navigating to home');
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
     
      {/* Final amount display */}
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