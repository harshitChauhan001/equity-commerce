const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Category = sequelize.define(
  'Category',
  {
    id:   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'categories',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Category;
