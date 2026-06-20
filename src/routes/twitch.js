const { Router } = require('express');
const passport = require('passport');
const config = require('../config');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Redirect user to Twitch OAuth consent screen
router.get('/auth/twitch', authLimiter, passport.authenticate('twitch', {
    scope: config.twitch.scopes,
    force_verify: true,
}));

// Twitch redirects here after user grants access.
// passport.authenticate verifies the state parameter — CSRF protected.
router.get('/auth/twitch/callback',
    passport.authenticate('twitch', { failureRedirect: '/auth/failed' }),
    (req, res) => {
        const { accessToken } = req.user;
        const dest = `http://localhost:${config.localClientPort}/twitch/auth/token?accessToken=${encodeURIComponent(accessToken)}`;
        res.redirect(dest);
    }
);

module.exports = router;
