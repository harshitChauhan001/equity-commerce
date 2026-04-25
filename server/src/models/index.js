const Product       = require('./Product');
const Variant       = require('./Variant');
const CustomerPrice = require('./CustomerPrice');
const Offer         = require('./Offer');
const Order         = require('./Order');
const OrderItem     = require('./OrderItem');
const User          = require('./User');
const CartItem      = require('./CartItem');
const Category      = require('./Category');

// ── Associations ─────────────────────────────────────────────────────────────

// Category 1 ──▶ N  Product
Category.hasMany(Product,   { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Product  1 ──▶ N  Variant
Product.hasMany(Variant,   { foreignKey: 'product_id', as: 'variants' });
Variant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Variant  1 ──▶ N  CustomerPrice
Variant.hasMany(CustomerPrice,   { foreignKey: 'variant_id', as: 'customerPrices' });
CustomerPrice.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

// User  1 ──▶ N  CustomerPrice  (proper FK, not loose string)
User.hasMany(CustomerPrice,   { foreignKey: 'customer_id', as: 'customPrices' });
CustomerPrice.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// User  1 ──▶ N  Order
User.hasMany(Order,   { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// Order 1 ──▶ N  OrderItem  (header / line-items split)
Order.hasMany(OrderItem,   { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Variant  1 ──▶ N  OrderItem
Variant.hasMany(OrderItem,    { foreignKey: 'variant_id', as: 'orderItems' });
OrderItem.belongsTo(Variant,  { foreignKey: 'variant_id', as: 'variant' });

// Offer  1 ──▶ N  Order
Offer.hasMany(Order,   { foreignKey: 'offer_id', as: 'orders' });
Order.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });

// User  1 ──▶ N  CartItem
User.hasMany(CartItem,   { foreignKey: 'user_id', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Variant  1 ──▶ N  CartItem
Variant.hasMany(CartItem,   { foreignKey: 'variant_id', as: 'cartItems' });
CartItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

module.exports = {
  Product, Variant, CustomerPrice,
  Offer, Order, OrderItem,
  User, CartItem, Category,
};
