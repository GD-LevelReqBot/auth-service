const dotenv = require('dotenv');
dotenv.config();

const REQUIRED = [
    'SESSION_SECRET',
    'TWITCH_CLIENT_ID',
    'TWITCH_CLIENT_SECRET',
    'TWITCH_REDIRECT_URI',
];

for (const key of REQUIRED) {
    if (!process.env[key]) {
        console.error(`[config] Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

module.exports = {
    port: parseInt(process.env.PORT || '3000', 10),
    sessionSecret: process.env.SESSION_SECRET,
    localClientPort: process.env.LOCAL_CLIENT_PORT || '24363',

    twitch: {
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        redirectUri: process.env.TWITCH_REDIRECT_URI,
        scopes: [
            // Chat
            'chat:read',
            'chat:edit',
            'channel:bot',
            'user:read:chat',
            'user:write:chat',
            // Moderation
            'moderator:manage:announcements',
            'moderator:manage:banned_users',
            'moderator:manage:chat_messages',
            'moderator:read:chatters',
            'moderator:read:followers',
            // Channel
            'channel:read:subscriptions',
            'channel:read:redemptions',
            'channel:manage:redemptions',
        ],
    },

    youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || null,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || null,
        redirectUri: process.env.YOUTUBE_REDIRECT_URI || null,
        // youtube.readonly — read live chat messages
        // openid + email + profile — lets us call /oauth2/v3/userinfo to show who's connected
        scopes: [
            'https://www.googleapis.com/auth/youtube.readonly',
            'openid',
            'email',
            'profile',
        ],
    },
};
