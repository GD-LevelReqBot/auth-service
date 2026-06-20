const passport = require('passport');
const { OAuth2Strategy } = require('passport-oauth');
const config = require('../config');

if (config.youtube.clientId && config.youtube.clientSecret && config.youtube.redirectUri) {
    passport.use('youtube', new OAuth2Strategy(
        {
            authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenURL: 'https://oauth2.googleapis.com/token',
            clientID: config.youtube.clientId,
            clientSecret: config.youtube.clientSecret,
            callbackURL: config.youtube.redirectUri,
            state: true,
        },
        (accessToken, refreshToken, profile, done) => {
            done(null, { provider: 'youtube', accessToken, refreshToken });
        }
    ));
}
