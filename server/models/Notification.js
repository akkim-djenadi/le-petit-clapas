const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('game_live', 'ticket_won', 'offer_new', 'announcement'), allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: true },
  is_broadcast: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'notifications', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Notification;
