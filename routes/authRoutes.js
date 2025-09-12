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
    // 根据需要调整权限范围 (scope)，例如：'user.info,file.read,file.write'
    authUrl.searchParams.append('scope', 'user.info,file.read,file.write');
    
    res.redirect(authUrl.toString());
});

// GET /auth/wps/callback - Handles callback from WPS
router.get('/wps/callback', async (req, res, next) => {
    const { challenge, code, error } = req.query;

    // --- [新增逻辑] ---
    // 1. 优先处理WPS的回调地址验证请求
    if (challenge) {
        console.log(`Received WPS URL validation challenge: ${challenge}`);
        // 直接将 challenge 值返回，即可通过验证
        return res.status(200).json({ challenge });
    }
    
    // 2. 处理授权过程中的错误
    if (error) {
        console.error('WPS OAuth Error:', error, req.query.error_description);
        return res.status(400).send(`Authorization failed: ${req.query.error_description || error}`);
    }

    // --- [原有逻辑的增强] ---
    // 3. 处理正常的授权码 (code)
    if (!code) {
        return res.status(400).send('Authorization code is missing, and no challenge was provided.');
    }

    try {
        // 使用 code 换取 WPS 的 access_token
        const wpsTokens = await wpsService.exchangeCodeForToken(code);
        
        // 创建我们自己应用的 JWT，用于管理前端会话
        const payload = {
            wps_access_token: wpsTokens.access_token,
            wps_refresh_token: wpsTokens.refresh_token,
            wps_user_openid: wpsTokens.openid,
        };

        const appToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });
        
        // 将用户重定向回前端，并在URL中附带我们生成的 JWT
        const frontendRedirectUrl = new URL(process.env.FRONTEND_URL);
        frontendRedirectUrl.searchParams.append('token', appToken);
        
        res.redirect(frontendRedirectUrl.toString());

    } catch (err) {
        next(err); // 将错误传递给全局错误处理器
    }
});

module.exports = router;
