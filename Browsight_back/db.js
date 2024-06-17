const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database_name', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: "./database.sqlite"
});

module.exports = sequelize;