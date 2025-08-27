const SIDE_OPTIONS = [
  { name: "Rice Noodle", price: 4 },
  { name: "Steamed Jasmine Rice", price: 4 },
  { name: "Seafood", price: 4 },
  { name: "Extra meats", price: 7 }
];

const EXCLUDED_CATEGORIES = [
  "cold-rolls",
  "baos-steamed-buns",
  "them-extras",
  "vietnamese-drinks"
];

// Map dish IDs to categories for exclusion logic
const CATEGORY_MAP = {
  // mi-kho-dry-noodles
  1: "mi-kho-dry-noodles",
  2: "mi-kho-dry-noodles",
  3: "mi-kho-dry-noodles",
  4: "mi-kho-dry-noodles",
  5: "mi-kho-dry-noodles",
  6: "mi-kho-dry-noodles",
  // cold-rolls
  7: "cold-rolls",
  8: "cold-rolls",
  9: "cold-rolls",
  10: "cold-rolls",
  11: "cold-rolls",
  // goi-salads
  12: "goi-salads",
  13: "goi-salads",
  14: "goi-salads",
  15: "goi-salads",
  16: "goi-salads",
  17: "goi-salads",
  // noodle-soups
  18: "noodle-soups",
  19: "noodle-soups",
  20: "noodle-soups",
  21: "noodle-soups",
  22: "noodle-soups",
  23: "noodle-soups",
  24: "noodle-soups",
  54: "noodle-soups",
  55: "noodle-soups",
  56: "noodle-soups",
  57: "noodle-soups",
  // com-rices
  25: "com-rices",
  26: "com-rices",
  27: "com-rices",
  28: "com-rices",
  29: "com-rices",
  30: "com-rices",
  31: "com-rices",
  32: "com-rices",
  58: "com-rices",
  // the-b-bun
  33: "the-b-bun",
  34: "the-b-bun",
  35: "the-b-bun",
  36: "the-b-bun",
  37: "the-b-bun",
  38: "the-b-bun",
  // banh-mi
  39: "banh-mi",
  40: "banh-mi",
  41: "banh-mi",
  42: "banh-mi",
  59: "banh-mi",
  // baos-steamed-buns
  43: "baos-steamed-buns",
  44: "baos-steamed-buns",
  45: "baos-steamed-buns",
  46: "baos-steamed-buns",
  // them-extras
  47: "them-extras",
  48: "them-extras",
  49: "them-extras",
  50: "them-extras",
  // vietnamese-drinks
  51: "vietnamese-drinks",
  52: "vietnamese-drinks",
  53: "vietnamese-drinks"
};

const menuData = [
  // mi-kho-dry-noodles
  { id: 1, name: "Roast Pork Mi Kho", price: 17.90 },
  { id: 2, name: "Grilled Chicken Mi Kho", price: 16.90 },
  { id: 3, name: "Tofu Mi Kho", price: 15.90 },
  { id: 4, name: "Crispy Chicken Mi Kho", price: 17.90 },
  { id: 5, name: "Combo Mi Kho", price: 18.90 },
  { id: 6, name: "Seafood Mi Kho", price: 18.90 },

  // cold-rolls
  { id: 7, name: "Prawn Cold Rolls", price: 6.50 },
  { id: 8, name: "Vegetarian Cold Rolls", price: 5.90 },
  { id: 9, name: "Grilled Chicken Cold Rolls", price: 5.90 },
  { id: 10, name: "Roast Pork Cold Rolls", price: 5.90 },
  { id: 11, name: "Prawn and Pork Cold Rolls", price: 6.50 },

  // goi-salads
  { id: 12, name: "Chicken Goi", price: 15.90 },
  { id: 13, name: "Roast Pork Goi", price: 16.90 },
  { id: 14, name: "Prawn and Pork Goi", price: 16.90 },
  { id: 15, name: "Seafood Goi", price: 18.90 },
  { id: 16, name: "Tofu Goi", price: 15.90 },
  { id: 17, name: "Combo Goi", price: 18.90 },

  // noodle-soups
  { id: 18, name: "Beef Pho", price: 18.90 },
  { id: 19, name: "Grilled Chicken Pho", price: 18.90 },
  { id: 20, name: "Combo Beef Pho", price: 19.90 },
  { id: 21, name: "Seafood Pho", price: 19.90 },
  { id: 22, name: "Vegetarian Pho", price: 18.90 },
  { id: 23, name: "Bun Bo Hue", price: 19.90 },
  { id: 24, name: "Mi and Wontons", price: 18.90 },
  { id: 54, name: "Chicken Egg Noodle Soup", price: 19.90 },
  { id: 55, name: "Combo Mi Soup", price: 18.90 },
  { id: 56, name: "Chicken Laksa Noodle Soup", price: 16.90 },
  { id: 57, name: "Seafood Laksa Noodle Soup", price: 18.90 },

  // com-rices
  { id: 25, name: "Combination Rice", price: 18.90 },
  { id: 26, name: "Grilled Chicken Rice", price: 15.90 },
  { id: 27, name: "Special Fried Rice", price: 14.90 },
  { id: 28, name: "Grilled Pork Chop Rice", price: 16.90 },
  { id: 29, name: "Crispy Chicken Rice", price: 17.90 },
  { id: 30, name: "Fried Tofu and Rice", price: 14.90 },
  { id: 31, name: "Beef Stir Fried and Rice", price: 17.90 },
  { id: 32, name: "Roast Pork Chop Rice", price: 16.90 },
  { id: 58, name: "Yellow Curry Rice", price: 16.90 },

  // the-b-bun
  { id: 33, name: "Crackling Roast Pork Bun", price: 16.90 },
  { id: 34, name: "Spring Rolls Bun", price: 16.90 },
  { id: 35, name: "Beef Stir Fried Bun", price: 17.90 },
  { id: 36, name: "Grilled Chicken Bun", price: 16.90 },
  { id: 37, name: "Combo Bun", price: 18.90 },
  { id: 38, name: "Tofu Bun", price: 15.90 },

  // banh-mi
  { id: 39, name: "Roast Pork Banh Mi", price: 9.90 },
  { id: 40, name: "Grilled Chicken Banh Mi", price: 9.90 },
  { id: 41, name: "Tofu Banh Mi", price: 9.90 },
  { id: 42, name: "Banh Mi Combo", price: 10.90 },
  { id: 59, name: "Meal deal Banh Mi", price: 16.90 },
  { id: 60, name: "Grilled Chicken Banh Mi Extra", price: 10.90 },
  { id: 61, name: "Tofu Banh Mi Extra", price: 10.90 },
  { id: 62, name: "Banh Mi Combo Extra", price: 11.90 },

  // baos-steamed-buns
  { id: 43, name: "Pork Bao", price: 8.50 },
  { id: 44, name: "Chicken Bao", price: 8.50 },
  { id: 45, name: "Vegetarian Bao", price: 8.50 },
  { id: 46, name: "Seafood Bao", price: 9.50 },

  // them-extras
  { id: 47, name: "Spring Rolls", price: 2.40 },
  { id: 48, name: "Rice Noodle", price: 2.00 },
  { id: 49, name: "Steamed Jasmine Rice", price: 2.00 },
  { id: 50, name: "Extra Sauce", price: 2.00 },

  // vietnamese-drinks
  { id: 51, name: "Vietnamese Iced Coffee", price: 6.90 },
  { id: 52, name: "Fresh Coconut Juice", price: 5.50 },
  { id: 53, name: "Lemon Tea", price: 4.90 }
];

// Attach sides to dishes not in excluded categories
const menuDataWithSides = menuData.map(dish => {
  const category = CATEGORY_MAP[dish.id];
  if (!EXCLUDED_CATEGORIES.includes(category)) {
    return { ...dish, sides: SIDE_OPTIONS };
  }
  return dish;
});

export default menuDataWithSides;