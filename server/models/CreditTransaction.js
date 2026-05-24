const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CreditTransaction = sequelize.define('CreditTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  merchant_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
  note: { type: DataTypes.STRING(500), allowNull: true },
  price_paid: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'credit_transactions', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = CreditTransaction;
