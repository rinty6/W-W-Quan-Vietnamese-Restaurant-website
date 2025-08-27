import "./Footer.css";
import { FaInstagram, FaEnvelope, FaPhone } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="homepage-footer">
      <div className="footer-columns">
        {/* Address Section */}
        <div className="footer-address">
          <h3 className="footer-title">Our Location</h3>
          <p className="address">Shop T18 Ashwin Parade & South Rd, Torrensville SA 5031</p>
          <div className="footer-map">
            <iframe
              title="W&W Quan Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3262.019833578548!2d138.5613640762747!3d-34.9134380773727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ab0cf5bd4948eaf%3A0x1dbe244763f35585!2sW%26W%20Quan!5e0!3m2!1sen!2sau!4v1716360000000!5m2!1sen!2sau"
              width="100%"
              height="180"
              style={{ border: 0, borderRadius: 8, marginTop: "12px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* Contact Info */}
        <div className="footer-contact">
          <h3 className="footer-title">Contact</h3>
          <p>
            <FaPhone /> <a href="tel:0883543222" className="footer-link">0883543222</a>
          </p>
          <p>
            <FaEnvelope />{" "}
            <a href="duongphuthinh2001@gmail.com" className="footer-link">
              linhly123@hotmail.com
            </a>
          </p>
          <p>
            <FaInstagram />{" "}
            <a
              href="https://www.instagram.com/yourprofile"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </p>
        </div>

        {/* Opening Hours */}
        <div className="footer-schedule">
          <h3 className="footer-title">Opening Hours</h3>
          <p>Monday: 9:00 AM - 7:00 PM</p>
          <p>Tuesday: 9:00 AM - 7:00 PM</p>
          <p>Wednesday: 9:00 AM - 7:00 PM</p>
          <p>Thursday: 9:00 AM - 8:00 PM</p>
          <p>Friday: 9:00 AM - 7:00 PM</p>
          <p>Saturday: 9:00 AM - 5:00 PM</p>
          <p>Sunday: 9:00 AM - 7:00 PM</p>
          <h3 className="footer-title">We are closed on public holidays</h3>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} W&W Quan. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;