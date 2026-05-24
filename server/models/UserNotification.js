const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserNotification = sequelize.define('UserNotification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  notification_id: { type: DataTypes.INTEGER, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'user_notifications', timestamps: false });
module.exports = UserNotification;
