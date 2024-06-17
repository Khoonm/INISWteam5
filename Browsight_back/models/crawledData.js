const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Employee = require('./employee.js');

const CrawledData = sequelize.define('CrawledData', {
    IDX_CD: {
        type: DataTypes.INTEGER,
        primaryKey : true,
        unique : true,
        allowNull: false,
        autoIncrement: true,
    },
    USER_KEY_CD: {
        type: DataTypes.STRING(8),
        references: {
            model: Employee,
            key: 'USER_KEY_CD'
        },
        allowNull: false,
    },
    GET_DATE_YMD: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    GET_TIME_DT: {
        type: DataTypes.STRING(5),
        allowNull: false,
    },
    URL_STR: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    DATA_STR: {
        type: DataTypes.STRING(5000),
        allowNull: false,
    },
}, {
  timestamps: false
});

Employee.hasMany(CrawledData, { foreignKey: 'USER_KEY_CD' });
CrawledData.belongsTo(Employee, { foreignKey: 'USER_KEY_CD' });

module.exports = CrawledData;
