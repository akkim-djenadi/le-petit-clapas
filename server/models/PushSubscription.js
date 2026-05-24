const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PushSubscription = sequelize.define('PushSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  endpoint: { type: DataTypes.TEXT, allowNull: false },
  p256dh: { type: DataTypes.TEXT, allowNull: false },
  auth: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'push_subscriptions', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = PushSubscription;
