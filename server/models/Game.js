const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Game = sequelize.define('Game', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('quiz', 'enigme', 'flappy'), allowNull: false },
  content: { type: DataTypes.JSON, allowNull: true },
  ticket_offer_id: { type: DataTypes.INTEGER, allowNull: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('scheduled', 'active', 'ended'), defaultValue: 'scheduled' },
  winner_id: { type: DataTypes.INTEGER, allowNull: true },
  starts_at: { type: DataTypes.DATE, allowNull: false },
  ends_at: { type: DataTypes.DATE, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'games', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Game;
