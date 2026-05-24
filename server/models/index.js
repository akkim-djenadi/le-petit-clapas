const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('petitclapas_test', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});
module.exports = { sequelize };
