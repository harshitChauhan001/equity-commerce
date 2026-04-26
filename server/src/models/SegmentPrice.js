const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

/**
 * Explicit price for a (segment, variant) pair.
 * If a row exists here it overrides base_price for all users in that segment.
 */
const SegmentPrice = sequelize.define(
  'SegmentPrice',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    segmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'segment_id',
    },
    variantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'variant_id',
    },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    tableName: 'segment_prices',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['segment_id', 'variant_id'] }, // one price per segment per variant
      { fields: ['segment_id'] },
    ],
  }
);

module.exports = SegmentPrice;
