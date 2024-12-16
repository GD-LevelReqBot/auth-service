const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET || 'session-secret-fallback-atasbu6dasd5r687b56arsd8',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use('twitch', new OAuth2Strategy({
        authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
        tokenURL: 'https://id.twitch.tv/oauth2/token',
        clientID: process.env.TWITCH_CLIENT_ID || 'xa7q77aepewgt88z6d566olye10kc8',
        clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
        callbackURL: process.env.REDIRECT_URI || 'http://localhost:3000/auth/twitch/callback',
        state: true
    },
    function(accessToken, refreshToken, profile, done) {
        // Simply pass the access token back
        return done(null, { accessToken, refreshToken });
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Route to initiate Twitch authentication
app.get('/auth/twitch', passport.authenticate('twitch', {
    scope: ['user_read', 'channel:bot', 'user:read:chat', 'user:write:chat', 'moderator:manage:announcements'],
    force_verify: true
}));

// Callback route
app.get('/auth/twitch/callback',
    passport.authenticate('twitch', {
        // failureRedirect: '/auth/failed'
    }),
    (req, res) => {
        // Ensure we have a user and access token
        if (!req.user || !req.user.accessToken) {
            return res.json(req);
        }

        // Redirect to client with access token
        res.redirect(`http://localhost:24363/twitch/auth/token?accessToken=${encodeURIComponent(req.user.accessToken)}`);
    }
);

// Failed authentication route
app.get('/auth/failed', (req, res) => {
    res.status(401).json({
        success: false,
        error: 'Authentication failed'
    });
});

// Server configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Authentication service running on port ${PORT}`);
});