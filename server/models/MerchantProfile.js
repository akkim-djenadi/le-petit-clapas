const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MerchantProfile = sequelize.define('MerchantProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  commerce_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  tickets_balance: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'merchant_profiles', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = MerchantProfile;
