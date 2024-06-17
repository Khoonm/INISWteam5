const express = require('express');
const router = express.Router();
const Employee = require('../models/employee.js');

router.post('/employee', async (req, res) => {
    const { USER_KEY_CD, USER_NM, REG_YMD, DEPT_NM, HP_NUM } = req.body;
    try {
        const employee = await Employee.create({ 
            USER_KEY_CD, 
            USER_NM, 
            REG_YMD, 
            DEPT_NM, 
            HP_NUM 
        });
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create employee' });
    }
});
  
router.get('/employee', async (req, res) => {
    try {
        const employee = await Employee.findAll();
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve employees' });
    }
});
  
router.get('/employee/:USER_KEY_CD', async (req, res) => {
    const { USER_KEY_CD } = req.params;
    try {
        const employee = await Employee.findByPk(USER_KEY_CD);
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve employee' });
    }
});
  
router.put('/employee/:USER_KEY_CD', async (req, res) => {
    const { USER_KEY_CD } = req.params;
    const { USER_NM, DEPT_NM, HP_NUM } = req.body;
    try {
        const employee = await Employee.findByPk(USER_KEY_CD);
        if (employee) {
            employee.USER_NM = USER_NM;
            employee.DEPT_NM = DEPT_NM;
            employee.HP_NUM = HP_NUM;
            await employee.save();
            res.json(employee);
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update employee' });
    }
});
  
router.delete('/employee/:USER_KEY_CD', async (req, res) => {
    const { USER_KEY_CD } = req.params;
    try {
        const employee = await Employee.findByPk(USER_KEY_CD);
        if (employee) {
            await employee.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;