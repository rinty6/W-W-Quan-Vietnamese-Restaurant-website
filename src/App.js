import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import ContactPage from './pages/ContactPage';
import PaymentPage from './pages/PaymentPage';
import AboutPage from './pages/AboutPage';
import OrderModal from "./components/OrderModal";
import './index.css';


function App() {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const location = useLocation();
  const hideNavAndFooter = location.pathname === "/payment";

  // Shared cart and order info state
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [orderType, setOrderType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [date, setDate] = useState("");
  const [clockTime, setClockTime] = useState("");

  // Clear cart and order info
  const clearCart = () => {
    setCart([]);
    setOrderNote("");
    setOrderType("");
    setCustomerName("");
    setCustomerPhone("");
    setDate("");
    setClockTime("");
    localStorage.removeItem('cart');
  };
  
  return (
    <>
      {!hideNavAndFooter && <NavBar onOrderClick={() => setOrderModalOpen(true)} />}
      <Routes>
        <Route path="/" element={
          <HomePage
            cart={cart}
            setCart={setCart}
            clearCart={clearCart}
          />
        } />
        <Route path="/menu" element={
          <MenuPage
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
        } />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
      {!hideNavAndFooter && <Footer />}
      {orderModalOpen && (
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
      )}
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

