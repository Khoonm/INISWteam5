const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Employee = require('./employee.js');

const Work = sequelize.define('Work', {
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
    DATE_YMD: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    TIME_DT: {
        type: DataTypes.STRING(5),
        allowNull: false,
    },
    FIN_FLG: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
  timestamps: false
});

Employee.hasMany(Work, { foreignKey: 'USER_KEY_CD' });
Work.belongsTo(Employee, { foreignKey: 'USER_KEY_CD' });

module.exports = Work;
