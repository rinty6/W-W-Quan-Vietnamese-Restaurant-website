import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HomePage.css";
import heroImg from "../assets/image/bun bowl.png";
import dealImg from "../assets/image/Banh Mi Deal + Spring roll.png";
import MakeReservationModal from "../components/MakeReservationModal";
import OrderModal from "../components/OrderModal";

export default function HomePage({ cart, setCart, clearCart }) {
  const menuRef = useRef(null);
  const hasClearedCart = useRef(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentProcessing, setShowPaymentProcessing] = useState(false);

  // Clear cart and show payment status when returning to home after payment
  useEffect(() => {
    // Check for payment status from multiple sources
    const paymentSuccess = location.state?.paymentSuccess || localStorage.getItem('paymentStatus') === 'success';
    const paymentProcessing = location.state?.paymentProcessing || localStorage.getItem('paymentStatus') === 'processing';

    console.log('Payment status check:', { paymentSuccess, paymentProcessing, locationState: location.state }); // Debug log

    if (paymentSuccess || paymentProcessing) {
      if (!hasClearedCart.current) {
        hasClearedCart.current = true;
        clearCart();

        if (paymentSuccess) {
          console.log('Showing payment success modal'); // Debug log
          setShowPaymentSuccess(true);
        } else if (paymentProcessing) {
          console.log('Showing payment processing modal'); // Debug log
          setShowPaymentProcessing(true);
        }

        // Clean up localStorage and navigation state
        localStorage.removeItem('paymentStatus');
        localStorage.removeItem('cart');
        
        // Clear the navigation state but keep the modal showing
        if (location.state) {
          navigate('/', { replace: true, state: {} });
        }
      }
    } else {
      hasClearedCart.current = false; // Reset when condition is false
    }
  }, [location.state, clearCart, navigate]);

  // Add these states for OrderModal
  const [orderNote, setOrderNote] = useState("");
  const [orderType, setOrderType] = useState("pickup");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [date, setDate] = useState("");
  const [clockTime, setClockTime] = useState("");

  // Open order modal
  const handleOrderNow = () => {
    setOrderModalOpen(true);
  };

  // Handle reservation submit (implement as needed)
  const handleReservationSubmit = (data) => {
    setReservationOpen(false);
  };

  // Close payment status modals
  const closePaymentSuccess = () => {
    setShowPaymentSuccess(false);
  };

  const closePaymentProcessing = () => {
    setShowPaymentProcessing(false);
  };

  return (
    <div className="homepage-root">
      {/* HERO SECTION */}
      <section className="hero-section">
        <img src={heroImg} alt="Vietnamese Cuisine" className="hero-img" />
        <div className="hero-overlay">
          <h1 className="hero-title">Welcome to W&W Vietnamese Quan</h1>
          <p className="hero-tagline">Authentic Vietnamese Cuisine in Adelaide.</p>
          <button className="hero-order-btn" onClick={handleOrderNow}>
            Order Now
          </button>
        </div>
      </section>

      {/* DEAL SECTION */}
      <section className="deal-visual-section">
        <div className="deal-visual-left">
          <h2 className="deal-visual-title">
            <span style={{ color: "black" }}>Banh Mi & Spring Roll Combo!</span>
          </h2>
          <p className="deal-visual-slogan">
            The best Vietnamese deal in Town.<br />
            Fresh, tasty, and ready for you!
          </p>
          <button
            className="deal-visual-order-btn"
            onClick={handleOrderNow}
          >
            Order Now
          </button>
        </div>
        <div className="deal-visual-right">
          <img
            src={dealImg}
            alt="Banh Mi Deal with Spring Roll"
            className="deal-visual-img"
          />
        </div>
      </section>

      {/* MENU SUGGESTION SECTION */}
      <section className="menu-suggestion-section" ref={menuRef}>
        <div className="menu-suggestion-left">
          <img
            src={require("../assets/image/pho.png")}
            alt="Vietnamese Pho"
            className="menu-suggestion-img"
          />
        </div>
        <div className="menu-suggestion-right">
          <h2 className="menu-suggestion-title">OUR MENU</h2>
          <p className="menu-suggestion-description">
            Welcome to W&W Quan - Your destination for fresh, authentic Vietnamese cuisine. From our sizzling wok to your plate, we serve up bold, vibrant flavors in every dish. Enjoy local favorites like our signature Banh Mi and comforting bowls of Pho, all made with care and tradition. Experience the true taste of Vietnam right here with us.
          </p>
          <button
            className="menu-suggestion-btn"
            onClick={() => navigate("/menu")}
          >
            VIEW MENU
          </button>
        </div>
      </section>

      {/* RESERVATION & DELIVERY SECTION */}
      <section className="reservation-delivery-section">
        <div className="reservation-delivery-left">
          <img
            src={require("../assets/image/All_dishes.jpeg")}
            alt="All Dishes"
            className="reservation-delivery-img"
          />
        </div>
        <div className="reservation-delivery-right">
          <h2 className="reservation-delivery-title">DINE WITH US OR ORDER ONLINE</h2>
          <p className="reservation-delivery-description">
            Reserve your table for an authentic Vietnamese experience, or get your favorite dishes delivered to your door!
          </p>
          <div className="reservation-delivery-btn-group">
            <button
              className="reservation-delivery-btn"
              onClick={() => setReservationOpen(true)}
            >
              Make a Reservation
            </button>
            <a
              className="reservation-delivery-btn"
              href="https://www.ubereats.com/store/w-%26-w-quan-vietnamese/4CZjbHEuXqah42Nt2x-fkw?diningMode=DELIVERY&sc=SEARCH_SUGGESTION"
              target="_blank"
              rel="noopener noreferrer"
            >
              Uber Eats
            </a>
          </div>
        </div>
      </section>

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="payment-status-overlay">
          <div className="payment-status-modal">
            <button className="payment-status-close" onClick={closePaymentSuccess}>
              ×
            </button>
            <div className="payment-status-icon success">
              ✓
            </div>
            <h3 className="payment-status-title">Payment Successful</h3>
            <p className="payment-status-message">
              Thank you for your order! Your payment has been processed successfully. We will start preparing your delicious Vietnamese dishes right away and you will receive a confirmation email shortly.
            </p>
            <button className="payment-status-button" onClick={closePaymentSuccess}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentProcessing && (
        <div className="payment-status-overlay">
          <div className="payment-status-modal">
            <button className="payment-status-close" onClick={closePaymentProcessing}>
              ×
            </button>
            <div className="payment-status-icon processing">
              ⏳
            </div>
            <h3 className="payment-status-title">Payment Processing</h3>
            <p className="payment-status-message">
              Your payment is being processed. This may take a few minutes when paying with bank transfer. You will receive a confirmation email once the payment is complete.
            </p>
            <button className="payment-status-button" onClick={closePaymentProcessing}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      <MakeReservationModal
        open={reservationOpen}
        onClose={() => setReservationOpen(false)}
        onSubmit={handleReservationSubmit}
      />

      {/* Order Modal (if you use one) */}
      <OrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        cart={cart}
        setCart={setCart}
        orderNote={orderNote}
        setOrderNote={setOrderNote}
        orderType={orderType}
        setOrderType={setOrderType}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        date={date}
        setDate={setDate}
        clockTime={clockTime}
        setClockTime={setClockTime}
      />
    </div>
  );
}