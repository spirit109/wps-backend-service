const axios = require('axios');

const wpsApiClient = axios.create({
    baseURL: process.env.WPS_OAUTH_URL,
});

async function exchangeCodeForToken(code) {
    try {
        const response = await wpsApiClient.post('/oauth2/v1/token', null, {
            params: {
                app_id: process.env.WPS_APP_ID,
                app_secret: process.env.WPS_APP_SECRET,
                grant_type: 'authorization_code',
                code: code,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);
        throw new Error('Failed to get access token from WPS.');
    }
}

async function callWpsApi(wpsAccessToken, method, url, data = null) {
    try {
        const response = await wpsApiClient({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${wpsAccessToken}`,
            },
            data,
        });
        return response.data;
    } catch (error) {
        console.error(`WPS API call failed for ${method.toUpperCase()} ${url}:`, error.response?.data || error.message);
        const apiError = new Error(error.response?.data?.error?.message || 'WPS API request failed.');
        apiError.statusCode = error.response?.status || 502;
        throw apiError;
    }
}

module.exports = {
    exchangeCodeForToken,
    callWpsApi,
};