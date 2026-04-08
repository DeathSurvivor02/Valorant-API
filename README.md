# Valorant API

A lightweight Node.js/Express API that provides match statistics, player data, and other game‑related information for **Valorant**. The goal of this repository is to expose a simple REST interface that can be consumed by front‑end applications, bots, or analytics tools.

## Features (planned)
- Retrieve player profile information (rank, level, recent matches)
- Query match details by match ID
- Get live game statistics (team composition, scores)
- Rate‑limited endpoints to stay within Riot API quotas
- Dockerfile for easy container deployment

## Getting Started
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your Riot API key:
   ```
   RIOT_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   npm run dev
   ```
5. Access the API at `http://localhost:3000/api/...`.

## Contributing
Feel free to open issues or submit pull requests to add new endpoints, improve error handling, or enhance documentation.

---
*This repository was initially empty and has been set up with a basic README to describe the intended purpose of the Valorant API.*
