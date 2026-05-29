const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    ...(isProd && {
      dialectOptions: {
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      },
    }),
  }
);

module.exports = sequelize;
