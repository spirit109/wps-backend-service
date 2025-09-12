const express = require('express');
const jwt = require('jsonwebtoken');
const wpsService = require('../services/wpsService');
const router = express.Router();

// GET /auth/wps - Redirects user to WPS for authorization
router.get('/wps', (req, res) => {
    const authUrl = new URL(`${process.env.WPS_OAUTH_URL}/oauth2/v1/authorize`);
    authUrl.searchParams.append('app_id', process.env.WPS_APP_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', process.env.WPS_REDIRECT_URI);
    authUrl.searchParams.append('scope', 'user.info,file.read,file.write');
    
    res.redirect(authUrl.toString());
});

// GET /auth/wps/callback - Handles callback from WPS
router.get('/wps/callback', async (req, res, next) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code is missing.');
    }

    try {
        const wpsTokens = await wpsService.exchangeCodeForToken(code);
        
        const payload = {
            wps_access_token: wpsTokens.access_token,
            wps_refresh_token: wpsTokens.refresh_token,
            wps_user_openid: wpsTokens.openid,
        };

        const appToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
        
        const frontendRedirectUrl = new URL(process.env.FRONTEND_URL);
        frontendRedirectUrl.searchParams.append('token', appToken);
        
        res.redirect(frontendRedirectUrl.toString());

    } catch (error) {
        next(error);
    }
});

module.exports = router;