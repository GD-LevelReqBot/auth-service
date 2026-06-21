const { Router } = require('express');
const passport = require('passport');
const axios = require('axios');
const config = require('../config');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

const isConfigured = () =>
    config.youtube.clientId && config.youtube.clientSecret && config.youtube.redirectUri;

router.get('/auth/youtube', authLimiter, (req, res, next) => {
    if (!isConfigured()) {
        return res.status(503).json({ success: false, error: 'YouTube auth is not configured on this server.' });
    }
    passport.authenticate('youtube', {
        scope: config.youtube.scopes,
        access_type: 'offline',
        prompt: 'consent',
    })(req, res, next);
});

router.get('/auth/youtube/callback', (req, res, next) => {
    if (!isConfigured()) {
        return res.status(503).json({ success: false, error: 'YouTube auth is not configured on this server.' });
    }
    passport.authenticate('youtube', { failureRedirect: '/auth/failed' }, (err, user) => {
        if (err) {
            console.error('[youtube] OAuth error:', err);
            return res.redirect('/auth/failed');
        }
        if (!user) {
            console.error('[youtube] Authentication failed — no user returned');
            return res.redirect('/auth/failed');
        }
        const dest = new URL(`http://127.0.0.1:${config.localClientPort}/youtube/auth/token`);
        dest.searchParams.set('accessToken',  user.accessToken);
        dest.searchParams.set('refreshToken', user.refreshToken || '');
        res.redirect(dest.toString());
    })(req, res, next);
});

// Exchange a refresh token for a new access token.
// Google may not return a new refresh token (only issued on first consent) —
// the desktop app handles that by keeping the old one if absent.
router.post('/auth/youtube/refresh', authLimiter, async (req, res) => {
    if (!isConfigured()) {
        return res.status(503).json({ error: 'YouTube auth is not configured on this server.' });
    }

    const { refresh_token } = req.body;
    if (!refresh_token) {
        return res.status(400).json({ error: 'refresh_token is required' });
    }

    try {
        const resp = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
            grant_type:    'refresh_token',
            refresh_token,
            client_id:     config.youtube.clientId,
            client_secret: config.youtube.clientSecret,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        res.json({
            access_token:  resp.data.access_token,
            // Google only returns a new refresh_token on first grant
            refresh_token: resp.data.refresh_token ?? null,
        });
    } catch (err) {
        const status  = err.response?.status ?? 500;
        const message = err.response?.data?.error_description ?? err.response?.data?.error ?? err.message;
        res.status(status).json({ error: message });
    }
});

module.exports = router;
