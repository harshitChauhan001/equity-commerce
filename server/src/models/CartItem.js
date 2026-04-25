const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const CartItem = sequelize.define(
  'CartItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    variantId: { type: DataTypes.UUID, allowNull: false, field: 'variant_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: 'cart_items',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'variant_id'] }, // one row per user+variant
    ],
  }
);

module.exports = CartItem;
