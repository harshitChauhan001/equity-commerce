const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Offer = sequelize.define(
  'Offer',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    discountType: {
      type: DataTypes.ENUM('flat', 'percentage'),
      allowNull: false,
      field: 'discount_type',
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'discount_value',
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'min_order_amount',
    },
    maxUses: { type: DataTypes.INTEGER, defaultValue: null, field: 'max_uses' },
    usedCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'used_count' },
    perCustomerLimit: { type: DataTypes.INTEGER, defaultValue: null, field: 'per_customer_limit' },
    validFrom: { type: DataTypes.DATE, defaultValue: null, field: 'valid_from' },
    validUntil: { type: DataTypes.DATE, defaultValue: null, field: 'valid_until' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    firstOrderOnly: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'first_order_only' },
    targetBankCode: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      field: 'target_bank_code',
      comment: 'null = all users; HDFC/ICICI/SBI/AXIS = bank-segment only',
    },
  },
  {
    tableName: 'offers',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Offer;
