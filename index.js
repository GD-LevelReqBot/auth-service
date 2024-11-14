// cloud-server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const axios = require('axios');
const cors = require('cors');

const app = express();
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://gdlqbot.superdev.one/auth/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:24363';

app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

let authDataStore = new Map(); // Store auth data temporarily with unique keys

passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_SECRET,
    callbackURL: CALLBACK_URL,
    state: true // Enable state for security
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            }
        });

        const userData = userResponse.data.data[0];
        const authData = {
            accessToken,
            refreshToken,
            username: userData.login,
            userId: userData.id
        };

        // Generate unique key for this auth session
        const authKey = Math.random().toString(36).substring(2);
        authDataStore.set(authKey, authData);

        // Clean up after 5 minutes
        setTimeout(() => {
            authDataStore.delete(authKey);
        }, 300000);

        done(null, { authKey });
    } catch (error) {
        done(error);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Initialize auth with state
app.get('/auth/init', (req, res) => {
    const state = Math.random().toString(36).substring(2);
    const scopes = ['user_read', 'channel:bot', 'user:read:chat', 'user:write:chat', 'moderator:manage:announcements'];

    const authUrl = `https://id.twitch.tv/oauth2/authorize` +
        `?client_id=${TWITCH_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes.join(' '))}` +
        `&state=${state}` +
        `&force_verify=true`;

    res.json({ url: authUrl, state });
});

// Callback handler
app.get('/auth/callback', passport.authenticate('twitch', { session: false }),
    (req, res) => {
        const authKey = req.user.authKey;
        res.redirect(`${CLIENT_URL}/twitch/success?key=${authKey}`);
    }
);

// Endpoint to fetch auth data
app.get('/auth/data/:key', (req, res) => {
    const authData = authDataStore.get(req.params.key);
    if (authData) {
        authDataStore.delete(req.params.key); // One-time use
        res.json({ success: true, data: authData });
    } else {
        res.json({ success: false, message: 'Invalid or expired auth key' });
    }
});

app.listen(3000);