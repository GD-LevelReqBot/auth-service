const passport = require('passport');
const { OAuth2Strategy } = require('passport-oauth');
const config = require('../config');

const strategy = new OAuth2Strategy(
    {
        authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
        tokenURL:         'https://id.twitch.tv/oauth2/token',
        clientID:         config.twitch.clientId,
        clientSecret:     config.twitch.clientSecret,
        callbackURL:      config.twitch.redirectUri,
        state:            true,
    },
    (accessToken, refreshToken, profile, done) => {
        done(null, { provider: 'twitch', accessToken, refreshToken });
    }
);

// passport-oauth2's base authorizationParams() returns {} and drops unknown
// options. Override it so Twitch-specific params actually reach the URL.
strategy.authorizationParams = function (options) {
    const params = {};
    // force_verify=true makes Twitch always show the authorization screen,
    // even if the user previously granted all requested scopes.
    if (options.force_verify) params.force_verify = 'true';
    return params;
};

passport.use('twitch', strategy);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
