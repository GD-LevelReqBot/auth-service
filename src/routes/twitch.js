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
router.get('/auth/twitch/callback', (req, res, next) => {
    passport.authenticate('twitch', (err, user) => {
        if (err) {
            console.error('[twitch] OAuth error:', err);
            return res.redirect('/auth/failed');
        }
        if (!user) {
            console.error('[twitch] Authentication failed — no user returned');
            return res.redirect('/auth/failed');
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('[twitch] Session login error:', loginErr);
                return res.redirect('/auth/failed');
            }
            const dest = `http://localhost:${config.localClientPort}/twitch/auth/token?accessToken=${encodeURIComponent(user.accessToken)}`;
            res.redirect(dest);
        });
    })(req, res, next);
});

module.exports = router;
