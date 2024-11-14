# Auth Service

A simple, dockerized service that handles automatic Twitch authentication. This service automatically initiates the Twitch OAuth process when accessed and returns the authentication token.

## Features

- Automatic Twitch OAuth authentication
- Dockerized deployment
- Simple JSON responses
- No UI interaction required
- Secure environment variable configuration

## Quick Start

1. Clone this repository
2. Create a `.env` file with your credentials:
```env
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
REDIRECT_URI=https://your-domain.com/auth/success
SESSION_SECRET=your-session-secret
```

3. Build and run with Docker:
```bash
docker-compose up --build
```

## Endpoints

- `/` - Automatically initiates Twitch authentication
- `/auth/success` - Returns authentication token on successful login
- `/auth/failed` - Returns error message on failed login

## Response Format

### Success Response
```json
{
    "success": true,
    "token": "your_access_token"
}
```

### Error Response
```json
{
    "success": false,
    "error": "Authentication failed"
}
```

## Requirements

- Docker
- Twitch Developer Account
- Twitch API Client ID and Secret

## Security Notes

- Always use HTTPS in production
- Keep your `.env` file secure and never commit it to version control
- Use secure session secrets in production
- Configure your Twitch OAuth redirect URLs appropriately

## License

MIT