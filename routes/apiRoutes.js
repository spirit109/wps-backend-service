const express = require('express');
const { callWpsApi } = require('../services/wpsService');
const router = express.Router();

function buildWpsValuesUrl(spreadsheetId, sheetName, range) {
    // IMPORTANT: The actual URL structure must be verified from WPS API documentation.
    // This is a plausible placeholder based on common spreadsheet APIs.
    return `/v1/spreadsheets/${spreadsheetId}/sheets/${encodeURIComponent(sheetName)}/values/${encodeURIComponent(range)}`;
}

// GET /api/sheets/{spreadsheetId}
router.get('/sheets/:spreadsheetId', async (req, res, next) => {
    const { spreadsheetId } = req.params;
    const { sheetName, range } = req.query;
    const { wps_access_token } = req.user;

    if (!sheetName || !range) {
        return res.status(400).json({ message: 'sheetName and range query parameters are required.' });
    }

    try {
        const apiUrl = buildWpsValuesUrl(spreadsheetId, sheetName, range);
        const data = await callWpsApi(wps_access_token, 'get', apiUrl);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

// POST /api/sheets/{spreadsheetId}/data
router.post('/sheets/:spreadsheetId/data', async (req, res, next) => {
    const { spreadsheetId } = req.params;
    const { sheetName, values, range = 'A1' } = req.body;
    const { wps_access_token } = req.user;

    if (!sheetName || !values || !Array.isArray(values)) {
        return res.status(400).json({ message: 'sheetName and a values array are required in the body.' });
    }
    
    try {
        const apiUrl = `${buildWpsValuesUrl(spreadsheetId, sheetName, range)}:append?valueInputOption=USER_ENTERED`;
        const payload = { values };
        const result = await callWpsApi(wps_access_token, 'post', apiUrl, payload);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// PUT /api/sheets/{spreadsheetId}/data
router.put('/sheets/:spreadsheetId/data', async (req, res, next) => {
    const { spreadsheetId } = req.params;
    const { sheetName, range, values } = req.body;
    const { wps_access_token } = req.user;

    if (!sheetName || !range || !values) {
        return res.status(400).json({ message: 'sheetName, range, and values are required in the body.' });
    }

    try {
        const apiUrl = `${buildWpsValuesUrl(spreadsheetId, sheetName, range)}?valueInputOption=USER_ENTERED`;
        const payload = { values };
        const result = await callWpsApi(wps_access_token, 'put', apiUrl, payload);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/sheets/{spreadsheetId}/data
router.delete('/sheets/:spreadsheetId/data', async (req, res, next) => {
    const { spreadsheetId } = req.params;
    const { sheetName, range } = req.body;
    const { wps_access_token } = req.user;

    if (!sheetName || !range) {
        return res.status(400).json({ message: 'sheetName and range are required in the body.' });
    }
    
    try {
        const apiUrl = `${buildWpsValuesUrl(spreadsheetId, sheetName, range)}:clear`;
        const result = await callWpsApi(wps_access_token, 'post', apiUrl, {});
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;