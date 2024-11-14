// index.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
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
        clientID: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        callbackURL: process.env.REDIRECT_URI,
        state: true
    },
    function(accessToken, refreshToken, profile, done) {
        return done(null, {
            accessToken,
            refreshToken
        });
    }));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.get('/', (req, res) => {
    // Automatically redirect to Twitch auth
    res.redirect('/auth/twitch');
});

app.get('/auth/twitch', passport.authenticate('twitch', {
    scope: ['user_read', 'channel:bot', 'user:read:chat', 'user:write:chat', 'moderator:manage:announcements'],
    force_verify: true
}));

app.get('/auth/failed', (req, res) => {
    res.status(401).json({
        success: false,
        error: 'Authentication failed'
    });
});

app.get('/auth/success', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/failed');
    }

    // Send token back
    res.json({
        success: true,
        token: req.user.accessToken
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});