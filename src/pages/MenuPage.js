import { useState, useRef, useEffect } from "react";
import { menuCategories, menuDishes } from "../data/menuData";
import "./Menu.css";
import { FaSearch, FaPlus, FaChevronLeft, FaChevronRight, FaShoppingCart, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EXCLUDED_CATEGORIES = [
  "cold-rolls",
  "baos-steamed-buns",
  "them-extras",
  "vietnamese-drinks"
];

// Sides options
const SIDE_OPTIONS = [
  { name: "Rice Noodle", price: 4 },
  { name: "Steamed Jasmine Rice", price: 4 },
  { name: "Seafood", price: 4 },
  { name: "Extra meats", price: 7 }
];

export default function MenuPage({
  cart, setCart,
  orderNote, setOrderNote,
  orderType, setOrderType,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  date, setDate,
  clockTime, setClockTime
}) {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0].key);
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const tabsRef = useRef(null);
  const navigate = useNavigate();
  const [checkoutError, setCheckoutError] = useState("");
  const [showLeavePrompt, setShowLeavePrompt] = useState(false);
  const [pendingPath] = useState(null);
  const [dishModal, setDishModal] = useState(null); // {dish, qty, sides: []}

  const validateTime = (time) => {
    const [hours] = time.split(':').map(Number);
    return hours >= 9 && hours < 19; // 19 is 7 PM in 24-hour format
  };
  
  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Open modal for eligible dishes
  const handleOpenDishModal = (dish) => {
  setDishModal({
    dish,
    qty: 1,
    sides: []
  });
};
  
// Add to cart from modal
  const handleAddDishToCart = () => {
    if (dishModal) {
      const { dish, qty, sides } = dishModal;
      // Convert side names to objects
      const sideObjs = sides.map(sideName => {
        const sideObj = SIDE_OPTIONS.find(s => s.name === sideName);
        return sideObj ? { name: sideObj.name, price: sideObj.price } : null;
      }).filter(Boolean);
      const sidesTotal = sideObjs.reduce((sum, side) => sum + side.price, 0);
      setCart(prev => [
        ...prev,
        {
          ...dish,
          qty,
          sides: sideObjs, // <-- store as array of {name, price}
          dishPrice: dish.price, // original dish price
          price: dish.price + sidesTotal // for subtotal calculation
        }
      ]);
      setDishModal(null);
    }
  };

  const dishes = menuDishes[selectedCategory] || [];

  // Add to cart
  const handleAddToCart = (dish) => {
  setCart(prev => {
    const found = prev.find(item => item.id === dish.id);
    let newCart;
    if (found) {
      newCart = prev.map(item =>
        item.id === dish.id ? { ...item, qty: item.qty + 1 } : item
      );
    } else {
      newCart = [...prev, { ...dish, id: dish.id, qty: 1, dishPrice: dish.price, price: dish.price, sides: [] }];
    }
    return newCart;
  });
};

  // Remove all items
  const handleClearCart = () => {
    setCart([]);
    setOrderType("");
    setCustomerName("");
    setCustomerPhone("");
    setDate("");
    setClockTime("");
    setCheckoutError("");
  };

  // Remove single item
  const handleRemoveItem = (name) => setCart(prev => prev.filter(item => item.name !== name));

  // Change quantity
  const handleChangeQty = (name, delta) => setCart(prev =>
    prev.map(item =>
      item.name === name
        ? { ...item, qty: Math.max(1, item.qty + delta) }
        : item
    )
  );

  // Go to checkout
  const handleCheckout = () => {
    setCheckoutError(""); // Reset error

    if (cart.length === 0) {
      setCheckoutError("Please pick at least one item from the menu");
      return;
    }
    if (!orderType) {
      setCheckoutError("Please select an order type");
      return;
    }
    if (!customerName.trim()) {
      setCheckoutError("Please enter your name.");
      return;
    }
    if (!customerPhone.trim()) {
      setCheckoutError("Please enter your phone number.");
      return;
    }
    if (!date) {
      setCheckoutError("Please select a date.");
      return;
    }
    if (!clockTime) {
      setCheckoutError("Please select a time.");
      return;
    }

    // Prepare invoice/cart data
    const buildInvoice = () => ({
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        dishPrice: typeof item.dishPrice === "number" ? item.dishPrice : item.price,
        quantity: item.qty,
        sides: Array.isArray(item.sides) ? item.sides.map(side =>
          typeof side === "object" && side !== null
            ? { name: side.name, price: side.price }
            : { name: side, price: 0 }
        ) : []
      })),
      subtotal: cart.reduce((sum, item) => sum + (item.dishPrice ? item.dishPrice * item.qty : item.price * item.qty), 0),
      total: cart.reduce((sum, item) => {
        const sidesTotal = (item.sides || []).reduce((s, side) => s + (side.price || 0), 0);
        return sum + ((item.dishPrice || item.price) + sidesTotal) * item.qty;
      }, 0),
      name: customerName,
      phone: customerPhone,
      note: orderNote,
      pickupType: orderType,
      datetime: `${date} ${clockTime}`
    });

    // When user clicks to pay:
    const invoice = buildInvoice();
    navigate("/payment", { state: { invoice } });
  };

  useEffect(() => {
    if (cartOpen) {
      setCheckoutError("");
    }
  }, [cartOpen]);

  // Intercept navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cart]);

  return (
    <div className="menu-root">
      {/* Header Section */}
      <section className="menu-header-section">
        <div className="menu-header-left">
          <h1 className="menu-title">Menu</h1>
          <p className="menu-desc">Savor Vietnamese cuisine with diverse flavors</p>
        </div>
        <div className="menu-header-right">
          <div className="menu-search-bar">
            <FaSearch className="menu-search-icon" />
            <input
              type="text"
              placeholder="Search in W&W Quan"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Cart Icon */}
          <button className="menu-cart-btn" onClick={() => setCartOpen(true)}>
            <FaShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="menu-cart-badge">{cart.reduce((sum, item) => sum + item.qty, 0)}</span>
            )}
          </button>
        </div>
      </section>

      {/* Category Tabs with Arrow Buttons */}
      <div className="menu-category-tabs-wrapper">
        <button className="menu-category-arrow left" onClick={() => scrollTabs("left")} aria-label="Scroll left">
          <FaChevronLeft />
        </button>
        <nav className="menu-category-tabs" ref={tabsRef}>
          {menuCategories.map(cat => (
            <button
              key={cat.key}
              className={`menu-category-tab${selectedCategory === cat.key ? " active" : ""}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </nav>
        <button className="menu-category-arrow right" onClick={() => scrollTabs("right")} aria-label="Scroll right">
          <FaChevronRight />
        </button>
      </div>

      {/* Dishes List */}
      <section className="menu-dishes-section">
        <h2 className="menu-category-title">
          {menuCategories.find(c => c.key === selectedCategory)?.label}
        </h2>
        <div className="menu-dishes-list">
          {dishes
            .filter(dish =>
              dish.name.toLowerCase().includes(search.toLowerCase()) ||
              dish.desc.toLowerCase().includes(search.toLowerCase())
            )
            .map((dish, idx) => {
              const isExcluded = EXCLUDED_CATEGORIES.includes(selectedCategory);
              return (
                <div
                  className="menu-dish-card"
                  key={dish.name + idx}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleOpenDishModal(dish)}
                >
                  <div className="menu-dish-info">
                    <div className="menu-dish-name">{dish.name}</div>
                    <div className="menu-dish-price">A${dish.price.toFixed(2)}</div>
                    <div className="menu-dish-desc">{dish.desc}</div>
                  </div>
                  <div className="menu-dish-img-wrap">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="menu-dish-img"
                    />
                    <button
                      className="menu-add-btn"
                      aria-label="Add to cart"
                      onClick={e => {
                        e.stopPropagation();
                        if (isExcluded) {
                          handleAddToCart(dish);
                        } else {
                          handleOpenDishModal(dish);
                        }
                      }}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
      
      {/* Dish Modal */}
      {dishModal && (
        <div className="dish-modal-overlay" onClick={() => setDishModal(null)}>
          <div className="dish-modal" onClick={e => e.stopPropagation()}>
            <button className="dish-modal-close" onClick={() => setDishModal(null)}>&times;</button>
            <div className="dish-modal-content">
              <img src={dishModal.dish.image} alt={dishModal.dish.name} className="dish-modal-img" />
              <div className="dish-modal-info">
                <h2>{dishModal.dish.name}</h2>
                <div className="dish-modal-price">A${dishModal.dish.price.toFixed(2)}</div>
                <div className="dish-modal-desc">{dishModal.dish.desc}</div>
                {/* Only show sides if NOT in excluded categories */}
                {!EXCLUDED_CATEGORIES.includes(selectedCategory) && (
                  <div className="dish-modal-sides">
                    <div className="dish-modal-sides-title">Add Sides</div>
                    <div className="dish-modal-sides-list">
                      {SIDE_OPTIONS.map(side => (
                        <label key={side.name} className="dish-modal-side-option">
                          <input
                            type="checkbox"
                            checked={dishModal.sides.includes(side.name)}
                            onChange={e => {
                              setDishModal(modal => {
                                const sides = modal.sides.includes(side.name)
                                  ? modal.sides.filter(s => s !== side.name)
                                  : [...modal.sides, side.name];
                                return { ...modal, sides };
                              });
                            }}
                          />
                          {side.name} <span>+A${side.price.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="dish-modal-qty">
                  <button
                    onClick={() =>
                      setDishModal(modal => ({ ...modal, qty: Math.max(1, modal.qty - 1) }))
                    }
                  >-</button>
                  <span>{dishModal.qty}</span>
                  <button
                    onClick={() =>
                      setDishModal(modal => ({ ...modal, qty: modal.qty + 1 }))
                    }
                  >+</button>
                </div>
                <button className="dish-modal-add-btn" onClick={handleAddDishToCart}>
                  Add {dishModal.qty} to order • A$
                  {(
                    (dishModal.dish.price +
                      (!EXCLUDED_CATEGORIES.includes(selectedCategory)
                        ? dishModal.sides.reduce((sum, side) => {
                            const sideObj = SIDE_OPTIONS.find(s => s.name === side);
                            return sum + (sideObj ? sideObj.price : 0);
                          }, 0)
                        : 0)
                    ) * dishModal.qty
                  ).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Leave Prompt */}
      {showLeavePrompt && (
        <div className="leave-prompt-overlay" onClick={() => setShowLeavePrompt(false)}>
      <div className="leave-prompt-modal" onClick={e => e.stopPropagation()}>
        <div className="leave-prompt-title">
          Do you want to continue to order?
        </div>
        <button
          className="leave-prompt-cancel"
          onClick={() => setShowLeavePrompt(false)}
        >
          Cancel
        </button>
        <button
          className="leave-prompt-continue"
          onClick={() => {
            setShowLeavePrompt(false);
            setCart([]);
            navigate(pendingPath);
          }}
        >
          Continue
        </button>
      </div>
    </div>
      )}

      {/* Cart Drawer/Modal */}
      {cartOpen && (
        <div className="menu-cart-modal" onClick={() => setCartOpen(false)}>
          <div className="menu-cart-modal-content" onClick={e => e.stopPropagation()}>
            <div className="menu-cart-scrollable">
              <button className="menu-cart-close" onClick={() => setCartOpen(false)}>&times;</button>
              <h2>W&W Quan Vietnamese</h2>
              <button className="menu-cart-clear" onClick={handleClearCart}>
                <FaTrash /> Clear All
              </button>
              <div className="menu-cart-summary">
                <span>
                  {cart.reduce((sum, item) => sum + item.qty, 0)} items
                </span>
                <span>
                  Subtotal: A${cart.reduce((sum, item) => sum + item.qty * item.price, 0).toFixed(2)}
                </span>
              </div>
              <div className="menu-cart-items">
                {cart.length === 0 ? (
                  <div>Your cart is empty.</div>
                ) : (
                  cart.map(item => (
                    <div key={item.name + (item.sides ? item.sides.map(s => s.name).join(",") : "")}>
                      <div className="menu-cart-item" style={{ display: "flex", alignItems: "center" }}>
                        <span className="cart-qty-controls" style={{ minWidth: 60 }}>
                          <button onClick={() => handleChangeQty(item.name, -1)}>-</button>
                          {item.qty}
                          <button onClick={() => handleChangeQty(item.name, 1)}>+</button>
                        </span>
                        <span className="cart-item-name" style={{ flex: 1 }}>{item.name}</span>
                        <span className="cart-item-price" style={{ minWidth: 80, textAlign: "right" }}>
                          A${(item.dishPrice ? item.dishPrice * item.qty : 0).toFixed(2)}
                        </span>
                        <button onClick={() => handleRemoveItem(item.name)} aria-label="Remove item">&times;</button>
                      </div>
                      {item.sides && item.sides.length > 0 && item.sides.map(side => (
                        <div
                          key={side.name}
                          className="menu-cart-item-side"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginLeft: 60,
                            fontSize: "0.95em",
                            color: "#444"
                          }}
                        >
                          <span style={{ minWidth: 60 }}></span>
                          <span style={{ flex: 1 }}>{side.name}</span>
                          <span style={{ minWidth: 80, textAlign: "right" }}>
                            {side.price ? `A$${side.price.toFixed(2)}` : ""}
                          </span>
                          <span style={{ width: 36 }}></span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
              <div className="menu-cart-note">
                <label>Add an order note</label>
                <textarea
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Utensils, special instructions, etc."
                />
              </div>
              <div className="menu-cart-actions">
                <div className="cart-section-title">Please choose between takeaway/dine-in</div>
                <label className="cart-radio-option" style={{ display: 'inline-block', marginRight: '18px' }}>
                  <span>Take Away</span>
                  <input
                    type="radio"
                    name="orderType"
                    value="pickup"
                    checked={orderType === "pickup"}
                    onChange={() => {
                      setOrderType("pickup");
                      if (checkoutError) setCheckoutError("");
                    }}
                  />
                  <span className="custom-radio"></span>
                </label>
                <label className="cart-radio-option" style={{ display: 'inline-block', marginRight: '16px' }}>
                  <span>Dine-in</span>
                  <input
                    type="radio"
                    name="orderType"
                    value="reservation"
                    checked={orderType === "reservation"}
                    onChange={() => {
                      setOrderType("reservation");
                      if (checkoutError) setCheckoutError("");
                    }}
                  />
                  <span className="custom-radio"></span>
                </label>
                {orderType && (
                  <div className="cart-extra-fields">
                    <div className="cart-section-title">Customer Information</div>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={customerName}
                      onChange={e => {
                        setCustomerName(e.target.value);
                        if (checkoutError && e.target.value.trim()) setCheckoutError("");
                      }}
                      className={`cart-customer-name ${checkoutError && !customerName.trim() ? "input-error" : ""}`}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Your phone number"
                      value={customerPhone}
                      onChange={e => {
                        setCustomerPhone(e.target.value);
                        if (checkoutError && e.target.value.trim()) setCheckoutError("");
                      }}
                      className={`cart-customer-phone ${checkoutError && !customerPhone.trim() ? "input-error" : ""}`}
                      required
                    />
                    <div className="cart-pickup-details">
                      <div className="cart-pickup-datetime">
                        <span className="pickup-label">Date for {orderType === "pickup" ? "Take Away" : "Reservation"}</span>
                        <input
                          type="date"
                          value={date}
                          onChange={e => {
                            setDate(e.target.value);
                            if (checkoutError && e.target.value) setCheckoutError("");
                          }}
                          className={`cart-date ${checkoutError && !date ? "input-error" : ""}`}
                          required
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="cart-pickup-datetime">
                        <span className="pickup-label">Time for {orderType === "pickup" ? "Take Away" : "Reservation"}</span>
                        <input
                          type="time"
                          value={clockTime}
                          min="09:00"
                          max="19:00"
                          onChange={e => {
                            const newTime = e.target.value;
                            if (validateTime(newTime)) {
                              setClockTime(newTime);
                              if (checkoutError) setCheckoutError("");
                            } else {
                              setCheckoutError("Please select a time between 9 AM and 7 PM");
                            }
                          }}
                          className={`cart-time ${checkoutError && !clockTime ? "input-error" : ""}`}
                          required
                        />
                        <small className="time-hint">Business hours: 9 AM - 7 PM</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
           
            {/* Checkout */}
            <div className="menu-cart-footer"> 
              {checkoutError && (
                <div className="menu-cart-error">
                  {checkoutError}
                </div>
              )}
              <button className="menu-cart-checkout"
                onClick={handleCheckout}
              >
                Go to checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}