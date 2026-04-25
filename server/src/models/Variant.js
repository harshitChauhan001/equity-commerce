const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Variant = sequelize.define(
  'Variant',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      references: { model: 'products', key: 'id' },
    },
    name: { type: DataTypes.STRING, allowNull: false }, // e.g. "Red / XL"
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price',
    },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sku: { type: DataTypes.STRING, unique: true },
    version: { type: DataTypes.INTEGER, defaultValue: 0 }, // optimistic locking
  },
  {
    tableName: 'variants',
    underscored: true,
    timestamps: true,
    paranoid: true,       // soft delete — preserves order history integrity
    version: 'version',   // optimistic locking for concurrent stock updates
    indexes: [
      { fields: ['product_id'] },
      { fields: ['sku'] },
      { fields: ['stock'] },
    ],
  }
);

module.exports = Variant;
