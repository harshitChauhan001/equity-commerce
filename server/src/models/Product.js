const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Product = sequelize.define(
  'Product',
  {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    categoryId:  { type: DataTypes.UUID, allowNull: true, field: 'category_id', references: { model: 'categories', key: 'id' } },
    name:        { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    imageUrl:    { type: DataTypes.STRING, field: 'image_url', defaultValue: '' },
    active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'products',
    underscored: true,
    timestamps: true,
    paranoid: true,   // adds deleted_at — soft delete instead of hard delete
    indexes: [
      { fields: ['category_id'] },
      { fields: ['active'] },
    ],
  }
);

module.exports = Product;
