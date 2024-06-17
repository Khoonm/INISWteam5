const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Employee = require('./employee.js');

const Group = sequelize.define('Group', {
    GROUP_IDX: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        allowNull: false,
        autoIncrement: true,
    },
    TICKET_IDX: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    GROUP_NUM: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    TICKET_STR: {
        type: DataTypes.STRING(100),
        allowNull: false,
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
    HEAD_KEYWORD_STR: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    KEYWORD_STR: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    SCORE_NUM: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
}, {
  timestamps: false
});

Employee.hasMany(Group, { foreignKey: 'USER_KEY_CD' });
Group.belongsTo(Employee, { foreignKey: 'USER_KEY_CD' });


module.exports = Group;
