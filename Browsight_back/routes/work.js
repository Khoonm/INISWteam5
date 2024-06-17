const express = require('express');
const router = express.Router();
const Work = require('../models/work');
const Employee = require('../models/employee');

// Create a new work entry
router.post('/work', async (req, res) => {
    const { USER_KEY_CD, DATE_YMD, TIME_DT, FIN_FLG } = req.body;
    try {
        const work = await Work.create({ 
            USER_KEY_CD, 
            DATE_YMD, 
            TIME_DT,
            FIN_FLG
        });
        res.status(201).json(work);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create work' });
    }
});

// Retrieve all work entries
router.get('/work', async (req, res) => {
    try {
        const works = await Work.findAll({
            include: [
                {
                    model: Employee,
                    attributes: ['USER_NM'] // 가져오고 싶은 employee 속성
                }
            ]
        });
        res.json(works);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve works' });
    }
});

// Retrieve a specific work entry by ID
router.get('/work/:IDX_CD', async (req, res) => {
    const { IDX_CD } = req.params;
    try {
        const work = await Work.findByPk(IDX_CD);
        if (work) {
            res.json(work);
        } else {
            res.status(404).json({ error: 'Work not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve work' });
    }
});

// 업무 종료신호 전달
router.put('/work', async (req, res) => {
    const { USER_KEY_CD, DATE_YMD, TIME_DT, FIN_FLG } = req.body;
  
    try {
        // 매칭되는 모든 레코드를 찾기
        const works = await Work.findAll({
            where: {
                USER_KEY_CD,
                DATE_YMD,
            },
        });

        if (works.length > 0) {
            // 매칭된 각 레코드에 대해 TIME_DT를 계산하여 업데이트
            const updatedWorks = await Promise.all(works.map(async (work) => {
                const oldTime = work.TIME_DT;  // 기존 TIME_DT 값 가져오기

                // 새로운 TIME_DT 값에서 기존 TIME_DT 값을 빼는 로직 구현
                const oldTimeParts = oldTime.split(':');
                const newTimeParts = TIME_DT.split(':');
                
                const oldTimeInMinutes = parseInt(oldTimeParts[0]) * 60 + parseInt(oldTimeParts[1]);
                const newTimeInMinutes = parseInt(newTimeParts[0]) * 60 + parseInt(newTimeParts[1]);
                
                const diffInMinutes = newTimeInMinutes - oldTimeInMinutes;
                const diffHours = Math.floor(diffInMinutes / 60);
                const diffMinutes = diffInMinutes % 60;
                
                const diffTime = `${String(diffHours)}:${String(diffMinutes)}`;

                // 레코드 업데이트
                work.TIME_DT = diffTime;
                work.FIN_FLG = FIN_FLG;
                await work.save();

                return work;
            }));

            res.json({
                message: `${updatedWorks.length} work(s) updated successfully`,
                updatedWorks
            });
        } else {
            res.status(404).json({ error: 'No matching work records found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update work' });
    }
});

// Update a specific work entry by ID
router.put('/work/:IDX_CD', async (req, res) => {
    const { IDX_CD } = req.params;
    const { USER_KEY_CD, DATE_YMD, TIME_DT, FIN_FLG } = req.body;
    try {
        const work = await Work.findByPk(IDX_CD);
        if (work) {
            work.USER_KEY_CD = USER_KEY_CD;
            work.DATE_YMD = DATE_YMD;
            work.TIME_DT = TIME_DT;
            work.FIN_FLG = FIN_FLG;
            await work.save();
            res.json(work);
        } else {
            res.status(404).json({ error: 'Work not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update work' });
    }
});

// Delete a specific work entry by ID
router.delete('/work/:IDX_CD', async (req, res) => {
    const { IDX_CD } = req.params;
    try {
        const work = await Work.findByPk(IDX_CD);
        if (work) {
            await work.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Work not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete work' });
    }
});

module.exports = router;
