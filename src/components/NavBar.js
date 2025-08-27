import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/image/Restaurant Logo.png";
import "./NavBar.css";

export default function NavBar({ onOrderClick }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={() => navigate("/")}>
        <img src={logo} alt="W&W Quan" className="navbar-logo" />
      </div>
      <div className="navbar-center">
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/menu" className="navbar-link">Menu</Link>
        <Link to="/contact" className="navbar-link">Contact</Link>
        <Link to="/about" className="navbar-link">About</Link>
      </div>
      <div className="navbar-right">
        <button className="order-btn" onClick={onOrderClick}>
          Order Now
        </button>
      </div>
    </nav>
  );
}