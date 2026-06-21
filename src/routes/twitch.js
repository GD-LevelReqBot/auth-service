const { Router } = require('express');
const passport = require('passport');
const axios = require('axios');
const config = require('../config');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Redirect to Twitch OAuth.
// Optional ?target=bot query param: when present, the token callback goes to
// /twitch/bot/token instead of /twitch/auth/token so the app can distinguish
// which account was just authorized.
router.get('/auth/twitch', authLimiter, (req, res, next) => {
    const target = req.query.target === 'bot' ? 'bot' : 'channel';
    req.session.twitchAuthTarget = target;

    passport.authenticate('twitch', {
        scope: config.twitch.scopes,
        force_verify: true,
    })(req, res, next);
});

// Twitch redirects here after the user grants access.
// passport verifies the state — CSRF protected.
router.get('/auth/twitch/callback', (req, res, next) => {
    passport.authenticate('twitch', (err, user) => {
        if (err || !user) return res.redirect('/auth/failed');

        req.logIn(user, (loginErr) => {
            if (loginErr) return res.redirect('/auth/failed');

            const target = req.session.twitchAuthTarget || 'channel';
            const path   = target === 'bot' ? '/twitch/bot/token' : '/twitch/auth/token';
            // Use 127.0.0.1 explicitly — localhost can resolve to ::1 (IPv6) on
            // some Windows systems, which would miss the IPv4-only Axum server.
            const dest = new URL(`http://127.0.0.1:${config.localClientPort}${path}`);
            dest.searchParams.set('accessToken',  user.accessToken);
            dest.searchParams.set('refreshToken', user.refreshToken || '');
            res.redirect(dest.toString());
        });
    })(req, res, next);
});

// Exchange a refresh token for a new access+refresh token pair.
// The client secret stays on this server — the desktop app never sees it.
router.post('/auth/twitch/refresh', authLimiter, async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        return res.status(400).json({ error: 'refresh_token is required' });
    }

    try {
        const resp = await axios.post('https://id.twitch.tv/oauth2/token', new URLSearchParams({
            grant_type:    'refresh_token',
            refresh_token,
            client_id:     config.twitch.clientId,
            client_secret: config.twitch.clientSecret,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        res.json({
            access_token:  resp.data.access_token,
            refresh_token: resp.data.refresh_token,
        });
    } catch (err) {
        const status  = err.response?.status ?? 500;
        const message = err.response?.data?.message ?? err.message;
        res.status(status).json({ error: message });
    }
});

module.exports = router;
