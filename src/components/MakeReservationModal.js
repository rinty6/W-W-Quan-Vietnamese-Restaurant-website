import { useState, useEffect } from "react";
import "./MakeReservationModal.css";
import emailjs from "@emailjs/browser";

export default function MakeReservationModal({ open, onClose }) {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    guests: 1,
    date: today,
    time: currentTime,
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateTime = (time) => {
  const [hours] = time.split(':').map(Number);
  return hours >= 9 && hours < 19; // 19 is 7 PM in 24-hour format
};
  
  
  // Clear errors and success when modal closes
  useEffect(() => {
    if (!open) {
      setErrors({});
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Please enter your name.";
    if (!form.phone.trim()) errs.phone = "Please enter your phone number.";
    if (!form.date) errs.date = "Please select a date.";
    if (!form.time) errs.time = "Please select a time.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleGuestChange = (delta) => {
    setForm((prev) => ({
      ...prev,
      guests: Math.max(1, prev.guests + delta),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID, 
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID_RESERVATION, 
        {
          name: form.name,
          phone: form.phone,
          guests: form.guests,
          date: form.date,
          time: form.time,
          note: form.note,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY 
      );
      setSuccess(true);
      setForm({
        name: "",
        phone: "",
        guests: 1,
        date: today,
        time: currentTime,
        note: "",
      });
    } catch (err) {
      setErrors({ submit: "Failed to send reservation. Please try again." });
    }
    setSubmitting(false);
  };

  return (
    <div
      className="reservation-modal-overlay"
      onClick={onClose}
    >
      <div
        className="reservation-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <button className="reservation-x-btn" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="reservation-title">Make a Reservation</h2>
        <form className="reservation-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="reservation-section-title">Your Information</div>
          <div className="reservation-field">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
            />
            {errors.name && <div className="reservation-error">{errors.name}</div>}
          </div>
          <div className="reservation-field">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <div className="reservation-error">{errors.phone}</div>}
          </div>
          <div className="reservation-section-title">Reservation Details</div>
          <div className="reservation-row">
            <div className="reservation-guests">
              <label>Guests</label>
              <div className="reservation-control">
                <div className="guest-input">
                  <button type="button" onClick={() => handleGuestChange(-1)} disabled={form.guests <= 1}>-</button>
                  <span>{form.guests}</span>
                  <button type="button" onClick={() => handleGuestChange(1)}>+</button>
                </div>
              </div>
            </div>
            <div className="reservation-date">
              <label>Date</label>
              <div className="reservation-control">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className={errors.date ? "error" : ""}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              {errors.date && <div className="reservation-error">{errors.date}</div>}
            </div>
            <div className="reservation-time">
              <label>Time</label>
              <div className="reservation-control">
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  min="09:00"
                  max="19:00"
                  onChange={e => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, time: value }));
                    setErrors((prev) => ({ ...prev, time: undefined }));
                    if (!validateTime(value)) {
                      setErrors((prev) => ({
                        ...prev,
                        time: "Please select a time between 9:00 AM and 7:00 PM.",
                      }));
                    }
                  }}
                  className={errors.time ? "error" : ""}
                  required
                />
              </div>
              {errors.time && <div className="reservation-error">{errors.time}</div>}
            </div>
          </div>
          <div className="reservation-field">
            <textarea
              name="note"
              placeholder="Note (optional)"
              value={form.note}
              onChange={handleChange}
            />
          </div>
          {errors.submit && <div className="reservation-error">{errors.submit}</div>}
          {success && <div className="reservation-success">Reservation sent! We'll contact you soon.</div>}
          <div className="reservation-actions">
            <button type="submit" className="reservation-submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Make a Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}