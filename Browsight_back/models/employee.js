const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Employee = sequelize.define('Employee', {
  USER_KEY_CD: {
    type: DataTypes.STRING(8),
    primaryKey : true,
    unique : true,
    allowNull: false,
  },
  USER_NM: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
  REG_YMD: {
    type: DataTypes.STRING(10),
    defaultValue: () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    },
    allowNull: false,
  },
  DEPT_NM: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
  HP_NUM: {
    type: DataTypes.STRING(13),
    allowNull: false,
  },

}, {
  timestamps: false
});

module.exports = Employee;
