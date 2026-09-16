# Sonora: Text-to-Speech Application

A full-stack React and Express text-to-speech studio. Sonora validates text, presents language and voice choices, generates browser speech without an API key, and can return downloadable MP3 audio through ElevenLabs when configured.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm run install:all
copy server\\.env.example server\\.env
npm run dev
```

Open `http://localhost:5173`.

## Provider audio

The default mode uses the browser Speech Synthesis API, so the app is usable immediately. To enable MP3 generation and downloading, set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in `server/.env`. Credentials remain server-side and are never sent to the React client.

## API

- `GET /api/health` returns server and provider status.
- `GET /api/languages` returns supported languages.
- `GET /api/voices` returns language-compatible voices.
- `POST /api/tts` accepts `{ text, language, voice }` and returns browser mode metadata or an audio/mpeg response.

## Validation and security

The API applies helmet headers, CORS allow-listing, JSON size limits, rate limiting, maximum text length validation, and language/voice relationship checks. Do not commit `.env` files.

## Learning timeline

The repository history is organized into 14 incremental day commits matching the supplied project plan: requirements, UI, frontend, validation, selectors, API communication, integration, server foundation, endpoint, provider integration, audio response, playback, downloads, and final testing/documentation.
