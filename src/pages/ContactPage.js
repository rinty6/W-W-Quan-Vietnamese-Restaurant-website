import { useState } from "react";
import "./Contact.css";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID_PAYMENT;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const templateParams = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    };

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );
      setSuccess(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError("Failed to send message. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="contact-container">
      <h2>Send us a message</h2>
      <p>Your feedback is the most important thing to us!</p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your Name*"
          required
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Your Phone Number*"
          required
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email Address*"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="subject"
          placeholder="Subject*"
          required
          value={formData.subject}
          onChange={handleChange}
        />
        <textarea
          name="message"
          placeholder="Please write your message here..."
          rows="5"
          required
          value={formData.message}
          onChange={handleChange}
        ></textarea>

        {error && <div className="contact-error">{error}</div>}
        {success && (
          <div className="contact-success">
            Thank you for your message! We will get back to you soon.
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "SUBMIT"}
        </button>
      </form>
    </div>
  );
};

export default Contact;