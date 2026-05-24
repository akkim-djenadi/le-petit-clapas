const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserTicket = sequelize.define('UserTicket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  ticket_offer_id: { type: DataTypes.INTEGER, allowNull: false },
  qr_code: { type: DataTypes.STRING(36), unique: true, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'used', 'expired'), defaultValue: 'pending' },
  won_at: { type: DataTypes.DATE, allowNull: false },
  used_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'user_tickets', timestamps: false });
module.exports = UserTicket;
