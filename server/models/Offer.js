const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Offer = sequelize.define('Offer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  valid_from: { type: DataTypes.DATEONLY, allowNull: true },
  valid_until: { type: DataTypes.DATEONLY, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'offers', timestamps: false });
module.exports = Offer;
