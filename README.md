# Valorant-API

Node.js and Express REST service exposing Valorant player profiles, competitive rank/MMR, act history, and recent match telemetry, paired with a standalone frontend in `public/index.html`.

## Endpoints

* `GET /` - Serves the standalone web UI (`public/index.html`)
* `GET /api` - API overview and available endpoints
* `GET /api/health` - Health check and active provider mode (`henrik`, `riot`, or `demo`)
* `GET /api/player/:name/:tag` - Player profile, competitive rank/MMR, and recent act history (supports `?region=auto`)
* `GET /api/matches/:name/:tag` - Recent match telemetry (ACS, K/D ratio, headshot %, duration, server metadata)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` (optional; runs in `demo` mode if omitted):
   ```ini
   HENRIK_API_KEY=your_henrikdev_api_key
   # or
   RIOT_API_KEY=your_riot_api_key
   ```

3. Start the server:
   ```bash
   npm run dev
   # or
   npm start
   ```

4. Open `http://localhost:3000/` in your browser or query `http://localhost:3000/api/health`.

## Deployment

Configured for Vercel via `vercel.json`. Set `HENRIK_API_KEY` in Vercel Project Settings -> Environment Variables for live production mode.
