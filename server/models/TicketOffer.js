const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const TicketOffer = sequelize.define('TicketOffer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  advantage: { type: DataTypes.TEXT, allowNull: false },
  quantity_total: { type: DataTypes.INTEGER, allowNull: false },
  quantity_remaining: { type: DataTypes.INTEGER, allowNull: false },
  valid_until: { type: DataTypes.DATEONLY, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'ticket_offers', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = TicketOffer;
