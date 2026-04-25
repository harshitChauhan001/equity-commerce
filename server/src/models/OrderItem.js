const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

/**
 * OrderItem — one row per line item in an order.
 * An Order (the header) can have many OrderItems.
 * This is the standard e-commerce split: orders = cart-checkout snapshot,
 * order_items = individual products bought.
 */
const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
      references: { model: 'orders', key: 'id' },
    },
    variantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'variant_id',
      references: { model: 'variants', key: 'id' },
    },
    quantity:   { type: DataTypes.INTEGER, allowNull: false },
    unitPrice:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },   // locked-in price at purchase time
    discount:   { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    finalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'final_price' },  // unitPrice * qty - discount
  },
  {
    tableName: 'order_items',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['variant_id'] },
    ],
  }
);

module.exports = OrderItem;
