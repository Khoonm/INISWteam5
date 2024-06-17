const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket.js');

// Create a new ticket entry
router.post('/ticket', async (req, res) => {
    const { USER_KEY_CD, TITLE_STR, DATE_ST_YMD, DATE_END_YMD, CONTENT_STR, MANAGER_STR, STATUS_FLG } = req.body;
    try {
        const ticket = await Ticket.create({ 
            USER_KEY_CD, 
            TITLE_STR, 
            DATE_ST_YMD, 
            DATE_END_YMD, 
            CONTENT_STR, 
            MANAGER_STR, 
            STATUS_FLG 
        });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// Retrieve all ticket entries
router.get('/ticket', async (req, res) => {
    try {
        const ticket = await Ticket.findAll();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve tickets' });
    }
});

// Retrieve a specific ticket entry by ID
router.get('/ticket/:TICKET_IDX', async (req, res) => {
    const { TICKET_IDX } = req.params;
    try {
        const ticket = await Ticket.findByPk(TICKET_IDX);
        if (ticket) {
            res.json(ticket);
        } else {
            res.status(404).json({ error: 'Ticket not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve ticket' });
    }
});

// Update a specific ticket entry by ID
router.put('/ticket/:TICKET_IDX', async (req, res) => {
    const { TICKET_IDX } = req.params;
    const { USER_KEY_CD, TITLE_STR, DATE_ST_YMD, DATE_END_YMD, CONTENT_STR, MANAGER_STR, STATUS_FLG } = req.body;
    try {
        const ticket = await Ticket.findByPk(TICKET_IDX);
        if (ticket) {
            ticket.USER_KEY_CD = USER_KEY_CD;
            ticket.TITLE_STR = TITLE_STR;
            ticket.DATE_ST_YMD = DATE_ST_YMD;
            ticket.DATE_END_YMD = DATE_END_YMD;
            ticket.CONTENT_STR = CONTENT_STR;
            // ticket.EX_CONTENT_STR = EX_CONTENT_STR;
            ticket.MANAGER_STR = MANAGER_STR;
            ticket.STATUS_FLG = STATUS_FLG;
            await ticket.save();
            res.json(ticket);
        } else {
            res.status(404).json({ error: 'Ticket not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// Delete a specific work entry by ID
router.delete('/ticket/:TICKET_IDX', async (req, res) => {
    const { TICKET_IDX } = req.params;
    try {
        const ticket = await Ticket.findByPk(TICKET_IDX);
        if (ticket) {
            await ticket.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Ticket not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete ticket' });
    }
});

module.exports = router;
