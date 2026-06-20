const { Router } = require('express');
const passport = require('passport');
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
        const { accessToken } = user;
        const dest = `http://localhost:${config.localClientPort}/youtube/auth/token?accessToken=${encodeURIComponent(accessToken)}`;
        res.redirect(dest);
    })(req, res, next);
});

module.exports = router;
