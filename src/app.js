const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');

// Register passport strategies
require('./strategies/twitch');
require('./strategies/youtube');

const twitchRoutes = require('./routes/twitch');
const youtubeRoutes = require('./routes/youtube');

const app = express();

// Trust the immediate reverse proxy (nginx/Caddy) so rate limiting uses the real client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Only allow requests from localhost — this service has no public web UI
app.use(cors({
    origin: /^http:\/\/localhost(:\d+)?$/,
    credentials: true,
}));

app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000, // 5 min — only needed during auth flow
    },
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(twitchRoutes);
app.use(youtubeRoutes);

app.get('/auth/failed', (req, res) => {
    res.status(401).json({ success: false, error: 'Authentication failed.' });
});

app.get('/health', (_req, res) => {
    res.json({ ok: true, providers: ['twitch', 'youtube'] });
});

// 404 catch-all
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Not found.' });
});

module.exports = app;
