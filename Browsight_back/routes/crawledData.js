const express = require('express');
const router = express.Router();
const CrawledData = require('../models/crawledData');
const path = require('path');
const { exec } = require('child_process');
const pythonScriptPath = path.resolve(__dirname, '../clustering/clustering.py');
const fs = require("fs");
const axios = require('axios');


// Create a new data entry
router.post('/crawledData', async (req, res) => {
    const { USER_KEY_CD, GET_DATE_YMD, GET_TIME_DT, URL_STR, DATA_STR, TYPE_FLG } = req.body;
    try {
        if (TYPE_FLG == 1) {
            // USER_KEY_CD와 GET_DATE_YMD에 맞는 데이터 가져오기
            const transformData = (item) => ({
                TICKET_IDX: item['Ticket'],
                GROUP_NUM: item['Cluster'],
                TICKET_STR: item['Ticket Name'],
                USER_KEY_CD: USER_KEY_CD,
                DATE_YMD: GET_DATE_YMD,
                HEAD_KEYWORD_STR: item['Representation'][0],
                KEYWORD_STR: item['Representation'].join(', '),
                SCORE_NUM: item['Mean Similarity']
            });

            const dataToCluster = await CrawledData.findAll({
                where: {
                    USER_KEY_CD,
                    GET_DATE_YMD
                }
            });

            // 데이터가 있는지 확인
            if (dataToCluster.length > 0) {
                res.status(201).end();
                // 데이터를 JSON 문자열로 변환
                const dataString = JSON.stringify(dataToCluster);
                fs.writeFile("temp.json", dataString, (err) => console.log(err));

                // clustering.py 실행
                const command = `python ${pythonScriptPath} "${USER_KEY_CD}"`;

                exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error executing Python script: ${error}`);
                        console.error(`stderr: ${stderr}`);
                    }
                    
                    try {
                        fs.readFile("temp2.json", "utf8", async (err, data) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            const parsedData = JSON.parse(data);
                            for (const d of parsedData) {
                                try {
                                    const response = await axios.post('http://localhost:3000/group', transformData(d));
                                    console.log('POST 요청 성공:', response.data);
                                } catch (error) {
                                    console.error('POST 요청 실패:', error);
                                }
                            }
                            const workfin = {
                                USER_KEY_CD: USER_KEY_CD,
                                DATE_YMD: GET_DATE_YMD,
                                TIME_DT: GET_TIME_DT,
                                FIN_FLG: 1
                            }
                            await axios.put('http://localhost:3000/work', workfin);
                        });
                    } catch (parseError) {
                        console.error(`Error parsing Python script output: ${parseError}`);
                    }
                });
            } else {
                res.status(404).json({ error: 'No data found for the given USER_KEY_CD and GET_DATE_YMD' });
            }
        } else {
            // 새로운 데이터 항목 생성
            const crawledData = await CrawledData.create({ 
                USER_KEY_CD,
                GET_DATE_YMD,
                GET_TIME_DT,
                URL_STR,
                DATA_STR
            });
            res.status(201).json(crawledData);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create crawled data entry' });
    }
});

// Retrieve all crawled data entries
router.get('/crawledData', async (req, res) => {
    try {
        const crawledData = await CrawledData.findAll();
        res.json(crawledData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve crawled data entries' });
    }
});

// Retrieve a specific crawled data entry by ID
router.get('/crawledData/:IDX_CD', async (req, res) => {
    const { IDX_CD } = req.params;
    try {
        const crawledData = await CrawledData.findByPk(IDX_CD);
        if (crawledData) {
            res.json(crawledData);
        } else {
            res.status(404).json({ error: 'Crawled data entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve crawled data entry' });
    }
});

// Update a specific crawled data entry by ID
router.put('/crawledData/:IDX_CD', async (req, res) => {
    const { IDX_CD } = req.params;
    const { USER_KEY_CD, GET_DATE_YMD, GET_TIME_DT, URL_STR, DATA_STR, TYPE_FLG } = req.body;
    try {
        const crawledData = await CrawledData.findByPk(IDX_CD);
        if (crawledData) {
            crawledData.USER_KEY_CD = USER_KEY_CD;
            crawledData.GET_DATE_YMD = GET_DATE_YMD;
            crawledData.GET_TIME_DT = GET_TIME_DT;
            crawledData.URL_STR = URL_STR;
            crawledData.DATA_STR = DATA_STR;
            crawledData.TYPE_FLG = TYPE_FLG;
            await crawledData.save();
            res.json(crawledData);
        } else {
            res.status(404).json({ error: 'Crawled data entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update crawled data entry' });
    }
});

// Delete a specific crawled data entry by ID
router.delete('/crawledData/:IDX_CD', async (req, res) => {
    const { IDX_CD } = req.params;
    try {
        const crawledData = await CrawledData.findByPk(IDX_CD);
        if (crawledData) {
            await crawledData.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Crawled data entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete crawled data entry' });
    }
});

module.exports = router;
