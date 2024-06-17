const express = require('express');
const router = express.Router();
const Group = require('../models/group.js');

// Create a new group entry
router.post('/group', async (req, res) => {
    const { TICKET_IDX, GROUP_NUM, TICKET_STR, USER_KEY_CD, DATE_YMD, HEAD_KEYWORD_STR, KEYWORD_STR, SCORE_NUM } = req.body;
    try {
        const group = await Group.create({  
            TICKET_IDX, 
            GROUP_NUM,
            TICKET_STR, 
            USER_KEY_CD, 
            DATE_YMD,
            HEAD_KEYWORD_STR, 
            KEYWORD_STR,
            SCORE_NUM 
        });
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Retrieve all group entries
router.get('/group', async (req, res) => {
    try {
        const group = await Group.findAll();
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve groups' });
    }
});

// Retrieve a specific group entry by USER_KEY_CD, DATE_YMD
router.get('/group/report', async (req, res) => {
    const { USER_KEY_CD, DATE_YMD } = req.query;

    if (!USER_KEY_CD || !DATE_YMD) {
        return res.status(400).json({ error: 'USER_KEY_CD and DATE_YMD are required' });
    }

    try {
        const groups = await Group.findAll({
            where: {
                USER_KEY_CD,
                DATE_YMD
            }
        });

        const result = groups.map(group => ({
            Ticket: group.TICKET_IDX,
            Cluster: group.GROUP_NUM,
            TicketName: group.TICKET_STR,
            MeanSimilarity: group.SCORE_NUM,
            Representation: group.KEYWORD_STR
        }));
        console.log(result);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve groups' });
    }
});

// Retrieve a specific group entry by ID
router.get('/group/:GROUP_IDX', async (req, res) => {
    const { GROUP_IDX } = req.params;
    try {
        const group = await Group.findByPk(GROUP_IDX);
        if (group) {
            res.json(group);
        } else {
            res.status(404).json({ error: 'Group not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve group' });
    }
});

// Update a specific group entry by ID
router.put('/group/:GROUP_IDX', async (req, res) => {
    const { GROUP_IDX } = req.params;
    const { TICKET_IDX, GROUP_NUM, USER_KEY_CD, DATE_YMD, HEAD_KEYWORD_STR, KEYWORD_STR, SCORE_NUM } = req.body;
    try {
        const group = await Group.findByPk(GROUP_IDX);
        if (group) {
            group.TICKET_IDX = TICKET_IDX;
            group.GROUP_NUM = GROUP_NUM;
            group.USER_KEY_CD = USER_KEY_CD;
            group.DATE_YMD = DATE_YMD;
            group.HEAD_KEYWORD_STR = HEAD_KEYWORD_STR;
            group.KEYWORD_STR = KEYWORD_STR;
            group.SCORE_NUM = SCORE_NUM
            await group.save();
            res.json(group);
        } else {
            res.status(404).json({ error: 'Group not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// Delete a specific group entry by ID
router.delete('/group/:GROUP_IDX', async (req, res) => {
    const { GROUP_IDX } = req.params;
    try {
        const group = await Group.findByPk(GROUP_IDX);
        if (group) {
            await group.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Group not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

module.exports = router;
