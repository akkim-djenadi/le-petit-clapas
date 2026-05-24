const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commerce = sequelize.define('Commerce', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  subcategory_id: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  address: { type: DataTypes.STRING(500), allowNull: true },
  lat: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
  lng: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  website: { type: DataTypes.STRING(500), allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: true },
  hours: { type: DataTypes.JSON, allowNull: true },
  is_sponsored: { type: DataTypes.BOOLEAN, defaultValue: false },
  sponsor_rank: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'commerces', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Commerce;
