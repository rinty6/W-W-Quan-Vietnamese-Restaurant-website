import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Add refs to track update state and debounce timer
  const updateInProgressRef = useRef(false);
  const updateQueueRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastPaymentMethodRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Update display elements
  const updatePaymentDisplay = useCallback((surcharge, total, rate) => {
    const surchargeDisplay = document.getElementById('surcharge-display');
    if (surchargeDisplay) {
      surchargeDisplay.innerHTML = `<strong>Processing Fee (${rate}%):</strong> <span class="surcharge-amount">A$${surcharge.toFixed(2)}</span>`;
    }
    const totalDisplay = document.getElementById('total-display');
    if (totalDisplay) {
      totalDisplay.textContent = `A$${total.toFixed(2)}`;
    }
    const checkoutBtn = document.querySelector('.checkout-btn-dynamic');
    if (checkoutBtn && !loading) {
      checkoutBtn.textContent = `Pay A$${total.toFixed(2)}`;
    }
  }, [loading]);

  // Enhanced update function with retry logic and request queuing
  const updatePaymentIntentAmount = useCallback(async (paymentMethod, retryCount = 0) => {
    if (!clientSecret) return;
    
    // Skip if same payment method and no retry
    if (lastPaymentMethodRef.current === paymentMethod && retryCount === 0) {
      console.log('Skipping duplicate update for same payment method:', paymentMethod);
      return;
    }
    
    // If an update is in progress, queue this request
    if (updateInProgressRef.current) {
      console.log('Update in progress, queueing request for:', paymentMethod);
      updateQueueRef.current = paymentMethod;
      return;
    }

    updateInProgressRef.current = true;
    lastPaymentMethodRef.current = paymentMethod;
    const paymentIntentId = clientSecret.split('_secret_')[0];

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

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Payment intent updated successfully for method:', paymentMethod);
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
      }
    } catch (error) {
      console.error('Error updating payment intent:', error);
      
      // Implement retry logic for lock_timeout errors
      if (error.message && (error.message.includes('lock_timeout') || error.message.includes('429'))) {
        if (retryCount < MAX_RETRIES) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff with max 5s
          console.log(`Retrying update after ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          setTimeout(() => {
            updatePaymentIntentAmount(paymentMethod, retryCount + 1);
          }, backoffTime);
          
          updateInProgressRef.current = false;
          return;
        } else {
          console.error('Max retries reached for payment intent update');
        }
      }
    } finally {
      updateInProgressRef.current = false;
      
      // Process queued request if any
      if (updateQueueRef.current) {
        const queuedMethod = updateQueueRef.current;
        updateQueueRef.current = null;
        console.log('Processing queued update for:', queuedMethod);
        setTimeout(() => {
          updatePaymentIntentAmount(queuedMethod);
        }, 500); // Small delay before processing queued request
      }
    }
  }, [clientSecret]);

  // Debounced update function
  const debouncedUpdatePaymentIntent = useCallback((paymentMethod) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      updatePaymentIntentAmount(paymentMethod);
    }, 800); // Increased debounce delay to 800ms
  }, [updatePaymentIntentAmount]);

  useEffect(() => {
    if (!elements) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) return;

    let isInitialized = false;

    const handleChange = (event) => {
      // Skip the very first change event during initialization
      if (!isInitialized) {
        isInitialized = true;
        return;
      }

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
        
        // Use debounced update
        debouncedUpdatePaymentIntent(paymentMethodType);
      }
    };

    paymentElement.on('change', handleChange);

    // Set initial values for card payment
    const initialSurcharge = subtotal * ((surchargeRates.card || 1.5) / 100);
    setCurrentSurcharge(initialSurcharge);
    setTotalWithSurcharge(subtotal + initialSurcharge);
    updatePaymentDisplay(initialSurcharge, subtotal + initialSurcharge, surchargeRates.card || 1.5);
    
    // Delay initial update to avoid conflicts
    setTimeout(() => {
      if (!updateInProgressRef.current && !lastPaymentMethodRef.current) {
        updatePaymentIntentAmount('card');
      }
    }, 1500); // Increased initial delay

    // Cleanup
    return () => {
      paymentElement.off('change', handleChange);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [elements, subtotal, surchargeRates, updatePaymentDisplay, updatePaymentIntentAmount, debouncedUpdatePaymentIntent]);

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

    // Clear any pending updates before submitting
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Wait for any in-progress updates to complete
    let waitAttempts = 0;
    while (updateInProgressRef.current && waitAttempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      waitAttempts++;
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
        {loading ? 'Processing...' : `Pay A$${totalWithSurcharge.toFixed(2)}`}
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