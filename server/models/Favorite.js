const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Favorite = sequelize.define('Favorite', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true },
  commerce_id: { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: 'favorites', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Favorite;
