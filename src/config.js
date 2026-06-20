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
        // Scopes needed for chat, announcements, and subscriber detection
        scopes: ['channel:bot', 'user:read:chat', 'user:write:chat', 'moderator:manage:announcements'],
    },

    youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || null,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || null,
        redirectUri: process.env.YOUTUBE_REDIRECT_URI || null,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    },
};
