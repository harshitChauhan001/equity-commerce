require('dotenv').config();

module.exports = {
  app: {
    port: parseInt(process.env.PORT, 10) || 5000,
    env: process.env.NODE_ENV || 'development',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'equity_commerce',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },

  order: {
    lockTimeoutMs: parseInt(process.env.ORDER_LOCK_TIMEOUT_MS, 10) || 5000,
    maxQuantity: parseInt(process.env.MAX_ORDER_QUANTITY, 10) || 10,
  },

  pricing: {
    strategies: (process.env.PRICING_STRATEGIES || 'customer_specific,segment_specific,base')
      .split(',')
      .map((s) => s.trim()),
  },

  offer: {
    stackable: process.env.OFFER_STACKABLE === 'true',
  },

  stock: {
    lowThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD, 10) || 5,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'equity-commerce-super-secret-key-2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cart: {
    // Max unique items (lines) a user can have in their cart at once
    maxItems: parseInt(process.env.CART_MAX_ITEMS, 10) || 20,
  },

  offer: {
    stackable: process.env.OFFER_STACKABLE === 'true',
    // Hard cap on discount regardless of percentage (e.g., 20% of ₹50000 won't give ₹10000 off)
    maxDiscountCap: parseInt(process.env.MAX_DISCOUNT_CAP, 10) || 500,
  },

  shipping: {
    // Orders above this amount qualify for free shipping
    freeThreshold: parseInt(process.env.FREE_SHIPPING_THRESHOLD, 10) || 999,
    // Flat fee charged when order is below freeThreshold
    flatFee: parseInt(process.env.SHIPPING_FLAT_FEE, 10) || 49,
  },

  returns: {
    // Days after order creation within which return is allowed
    windowDays: parseInt(process.env.RETURN_WINDOW_DAYS, 10) || 7,
  },
};
