const passport = require('passport');
const { OAuth2Strategy } = require('passport-oauth');
const config = require('../config');

passport.use('twitch', new OAuth2Strategy(
    {
        authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
        tokenURL: 'https://id.twitch.tv/oauth2/token',
        clientID: config.twitch.clientId,
        clientSecret: config.twitch.clientSecret,
        callbackURL: config.twitch.redirectUri,
        state: true, // passport-oauth generates + verifies the state parameter
    },
    (accessToken, refreshToken, profile, done) => {
        done(null, { provider: 'twitch', accessToken, refreshToken });
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
