const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CommerceImage = sequelize.define('CommerceImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  cloudinary_url: { type: DataTypes.STRING(500), allowNull: false },
  cloudinary_public_id: { type: DataTypes.STRING(255), allowNull: false },
  is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'commerce_images', timestamps: false });
module.exports = CommerceImage;
