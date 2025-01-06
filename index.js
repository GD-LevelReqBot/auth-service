const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // To load environment variables

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

// Passport configuration for Twitch authentication
passport.use('twitch', new OAuth2Strategy({
        authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
        tokenURL: 'https://id.twitch.tv/oauth2/token',
        clientID: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
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

// Callback route where we receive the code and exchange it for an access token
app.get('/auth/twitch/callback', async (req, res) => {
    console.log('Twitch callback received');

    const { code, state } = req.query;

    if (!code || !state) {
        console.error('Missing code or state in the callback request');
        return res.status(400).json({ success: false, error: 'Missing code or state' });
    }

    console.log('Received state:', state);
    console.log('Received code:', code);

    // Optionally verify the state parameter here (check that it's the same as the one sent)
    // For simplicity, we are not checking it here, but it’s recommended to do so.

    try {
        // Exchange the code for an access token
        const tokenData = await exchangeCodeForToken(code);

        console.log('Token exchange successful', tokenData);

        // Redirect to the client with the access token
        res.redirect(`http://localhost:24363/twitch/auth/token?accessToken=${encodeURIComponent(tokenData.access_token)}`);
    } catch (error) {
        console.error('Error during token exchange:', error);
        res.status(500).json({ success: false, error: 'Token exchange failed' });
    }
});

// Function to exchange code for access token
async function exchangeCodeForToken(code) {
    const data = {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/twitch/callback'
    };

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', data);
        return response.data; // Contains access token, refresh token, etc.
    } catch (error) {
        console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
        throw error; // Re-throw so we can handle it in the callback
    }
}

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
