const { Router } = require('express');
const passport = require('passport');
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
            const dest   = `http://localhost:${config.localClientPort}${path}?accessToken=${encodeURIComponent(user.accessToken)}`;
            res.redirect(dest);
        });
    })(req, res, next);
});

module.exports = router;
