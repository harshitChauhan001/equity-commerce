const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    // Human-readable order number (ORD-000001) — useful for support & ops
    orderNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'order_number',
    },

    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id',
      references: { model: 'users', key: 'id' },
    },

    offerId: {
      type: DataTypes.UUID,
      defaultValue: null,
      field: 'offer_id',
      references: { model: 'offers', key: 'id' },
    },

    // Order-level financials (sum of all order_items)
    subtotal:    { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'total_amount' },

    // Full fulfillment lifecycle
    status: {
      type: DataTypes.ENUM(
        'pending',      // created, payment not yet confirmed
        'confirmed',    // payment confirmed
        'processing',   // being packed
        'shipped',      // dispatched
        'delivered',    // received by customer
        'cancelled',    // cancelled before shipment
        'failed'        // payment/system failure
      ),
      defaultValue: 'confirmed',
    },

    // Shipping snapshot (denormalised — address may change later)
    shippingName:    { type: DataTypes.STRING, allowNull: true, field: 'shipping_name' },
    shippingAddress: { type: DataTypes.TEXT,   allowNull: true, field: 'shipping_address' },
    shippingCity:    { type: DataTypes.STRING, allowNull: true, field: 'shipping_city' },
    shippingPin:     { type: DataTypes.STRING(10), allowNull: true, field: 'shipping_pin' },
  },
  {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['status'] },
      { fields: ['order_number'] },
    ],
  }
);

module.exports = Order;
