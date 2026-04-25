const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const CustomerPrice = sequelize.define(
  'CustomerPrice',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    variantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'variant_id',
      references: { model: 'variants', key: 'id' },
    },
    customerId: {
      type: DataTypes.UUID,   // proper FK reference to users.id
      allowNull: false,
      field: 'customer_id',
      references: { model: 'users', key: 'id' },
    },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    tableName: 'customer_prices',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['variant_id', 'customer_id'] }, // one price per customer per variant
      { fields: ['customer_id'] },                                // fast lookup: all prices for a user
    ],
  }
);

module.exports = CustomerPrice;
