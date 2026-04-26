const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Segment = sequelize.define(
  'Segment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'e.g. PREMIUM, REGULAR, HDFC_GOLD, NEW_USER',
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Optional multiplier for quick bulk pricing (1.0 = no change, 0.8 = 20% off base)
    // Used only when no explicit segment_price row exists for a variant
    priceMultiplier: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 1.0,
      allowNull: false,
      field: 'price_multiplier',
    },
  },
  {
    tableName: 'segments',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Segment;
