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
        console.log('OAuth2 Strategy callback triggered');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('Profile:', profile);

        // Simply pass the access token back
        return done(null, { accessToken, refreshToken });
    }
));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user);
});

passport.deserializeUser((user, done) => {
    console.log('Deserializing user:', user);
    done(null, user);
});

// Route to initiate Twitch authentication
app.get('/auth/twitch', (req, res, next) => {
    console.log('Initiating Twitch authentication');
    passport.authenticate('twitch', {
        scope: ['user_read', 'channel:bot', 'user:read:chat', 'user:write:chat', 'moderator:manage:announcements'],
        force_verify: true
    })(req, res, next);
});

// Callback route
app.get('/auth/twitch/callback',
    passport.authenticate('twitch', {
        failureRedirect: '/auth/failed'
    }),
    (req, res) => {
        console.log('Twitch callback received');
        
        if (!req.user || !req.user.accessToken) {
            console.error('No user or access token found in session');
            return res.status(400).json({ success: false, error: 'No access token in session' });
        }

        // Log the access token before redirecting
        console.log('Access Token:', req.user.accessToken);

        // Redirect to client with access token
        const redirectURL = `http://localhost:24363/twitch/auth/token?accessToken=${encodeURIComponent(req.user.accessToken)}`;
        console.log('Redirecting to:', redirectURL);
        res.redirect(redirectURL);
    }
);

// Generic failed authentication route
app.get('/auth/failed', (req, res) => {
    console.error('Authentication failed');

    // Log any error details (if available) for debugging purposes, but do not include them in the response
    if (req.query.error) {
        console.error(`Twitch error: ${req.query.error}`);
        console.error(`Twitch error_description: ${req.query.error_description}`);
    }

    // Return a simple, consistent error message to the user
    res.status(401).json({
        success: false,
        error: 'Authentication failed. Please try again later.'
    });
});

// Server configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Authentication service running on port ${PORT}`);
});
