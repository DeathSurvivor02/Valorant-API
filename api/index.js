const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const HENRIK_BASE_URL = 'https://api.henrikdev.xyz/valorant';
const RIOT_ACCOUNT_BASE_URL = 'https://americas.api.riotgames.com';
const RIOT_VAL_BASE_URL = 'https://na.api.riotgames.com';
const UPSTREAM_TIMEOUT_MS = 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * Fetch JSON from an upstream URL with timeout and structured error handling.
 */
async function fetchJson(url, headers = {}, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...headers
      },
      signal: controller.signal
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const err = new Error(
        data?.errors?.[0]?.message ||
          data?.status?.message ||
          data?.message ||
          `Upstream request failed with status ${response.status}`
      );
      err.status = response.status;
      err.upstream = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Upstream request timed out after ${timeoutMs}ms`);
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function getApiConfig() {
  const henrikKey = process.env.HENRIK_API_KEY?.trim();
  const riotKey = process.env.RIOT_API_KEY?.trim();

  if (henrikKey) {
    return { provider: 'henrik', apiKey: henrikKey };
  }
  if (riotKey) {
    return { provider: 'riot', apiKey: riotKey };
  }
  return { provider: 'demo', apiKey: null };
}

function extractRecentActs(bySeason) {
  if (!bySeason || typeof bySeason !== 'object') return [];
  return Object.entries(bySeason)
    .filter(([, s]) => s && !s.error && (s.final_rank_patched || s.number_of_games > 0))
    .slice(-4)
    .reverse()
    .map(([season, s]) => ({
      season: season.toUpperCase(),
      rank: s.final_rank_patched || 'Unranked',
      wins: s.wins ?? 0,
      games: s.number_of_games ?? 0
    }));
}

function computeMatchStats(target, totalRounds) {
  const s = target?.stats;
  if (!s) return null;
  const kills = s.kills ?? 0;
  const deaths = s.deaths ?? 0;
  const assists = s.assists ?? 0;
  const score = s.score ?? 0;
  const headshots = s.headshots ?? 0;
  const bodyshots = s.bodyshots ?? 0;
  const legshots = s.legshots ?? 0;
  const totalShots = headshots + bodyshots + legshots;

  return {
    kills,
    deaths,
    assists,
    score,
    acs: totalRounds > 0 ? Math.round(score / totalRounds) : null,
    kd: deaths > 0 ? Number((kills / deaths).toFixed(2)) : kills,
    headshots,
    bodyshots,
    legshots,
    headshotPct: totalShots > 0 ? Number(((headshots / totalShots) * 100).toFixed(1)) : null,
    damageMade: s.damage_made ?? null,
    damageReceived: s.damage_received ?? null
  };
}

function buildDemoPlayer(name, tag, region) {
  const resolvedRegion = region && region !== 'auto' ? region : 'na';
  return {
    mode: 'demo',
    notice: 'Set HENRIK_API_KEY or RIOT_API_KEY in environment variables for live Valorant data.',
    player: {
      name,
      tag,
      region: resolvedRegion,
      accountLevel: 142,
      lastUpdated: 'Just now',
      puuid: 'demo-puuid-0000-0000-000000000000',
      card: {
        small: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png',
        large: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png',
        wide: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png'
      },
      competitive: {
        currentTier: 'Diamond 2',
        tierImage: null,
        rankingInTier: 64,
        mmrChangeToLastGame: 19,
        elo: 1664,
        peakTier: 'Ascendant 1',
        peakSeason: 'E9A2',
        recentActs: [
          { season: 'E9A3', rank: 'Diamond 2', wins: 24, games: 43 },
          { season: 'E9A2', rank: 'Ascendant 1', wins: 31, games: 58 }
        ]
      }
    }
  };
}

function buildDemoMatches(name, tag, region) {
  const resolvedRegion = region && region !== 'auto' ? region : 'na';
  return {
    mode: 'demo',
    notice: 'Set HENRIK_API_KEY or RIOT_API_KEY in environment variables for live Valorant data.',
    player: `${name}#${tag}`,
    region: resolvedRegion,
    count: 2,
    matches: [
      {
        matchId: 'demo-match-001',
        map: 'Ascent',
        mode: 'Competitive',
        playedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        durationSeconds: 2140,
        server: 'US Central (Texas)',
        agent: 'Jett',
        agentIcon: null,
        stats: {
          kills: 22,
          deaths: 14,
          assists: 5,
          score: 6120,
          acs: 278,
          kd: 1.57,
          headshots: 18,
          bodyshots: 34,
          legshots: 4,
          headshotPct: 32.1,
          damageMade: 4210,
          damageReceived: 2890
        },
        result: 'Victory',
        roundsWon: 13,
        roundsLost: 9
      },
      {
        matchId: 'demo-match-002',
        map: 'Bind',
        mode: 'Competitive',
        playedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
        durationSeconds: 2380,
        server: 'US East (N. Virginia)',
        agent: 'Omen',
        agentIcon: null,
        stats: {
          kills: 16,
          deaths: 17,
          assists: 9,
          score: 4580,
          acs: 199,
          kd: 0.94,
          headshots: 11,
          bodyshots: 29,
          legshots: 5,
          headshotPct: 24.4,
          damageMade: 3190,
          damageReceived: 3420
        },
        result: 'Defeat',
        roundsWon: 10,
        roundsLost: 13
      }
    ]
  };
}

function handleUpstreamError(res, err, context) {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
  const mappedStatus = status === 401 || status === 403 ? 502 : status;

  return res.status(mappedStatus).json({
    error: `Failed to ${context}`,
    message: err.message,
    upstreamStatus: err.status || null
  });
}

// Root frontend & API info routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/api', (req, res) => {
  const { provider } = getApiConfig();
  res.json({
    message: 'Welcome to the Valorant API',
    mode: provider === 'demo' ? 'demo' : 'live',
    provider,
    endpoints: {
      health: '/api/health',
      player: '/api/player/:name/:tag?region=na',
      matches: '/api/matches/:name/:tag?region=na&size=5'
    }
  });
});

app.get('/api/health', (req, res) => {
  const { provider } = getApiConfig();
  res.json({
    status: 'ok',
    mode: provider === 'demo' ? 'demo' : 'live',
    provider,
    timestamp: new Date().toISOString()
  });
});

// Player profile & rank
app.get('/api/player/:name/:tag', async (req, res) => {
  const name = req.params.name?.trim();
  const tag = req.params.tag?.trim();
  const region = (req.query.region || 'na').toString().trim().toLowerCase();

  if (!name || !tag) {
    return res.status(400).json({ error: 'Both name and tag parameters are required.' });
  }

  const config = getApiConfig();
  if (config.provider === 'demo') {
    return res.json(buildDemoPlayer(name, tag, region));
  }

  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);

  try {
    if (config.provider === 'henrik') {
      const headers = { Authorization: config.apiKey };
      const accountRes = await fetchJson(
        `${HENRIK_BASE_URL}/v1/account/${encodedName}/${encodedTag}`,
        headers
      );
      const account = accountRes?.data || {};
      const playerRegion = account.region || region;

      let mmr = null;
      try {
        const mmrRes = await fetchJson(
          `${HENRIK_BASE_URL}/v2/mmr/${encodeURIComponent(playerRegion)}/${encodedName}/${encodedTag}`,
          headers
        );
        mmr = mmrRes?.data || null;
      } catch {
        // MMR may be unavailable for unranked or private profiles; return account data gracefully
      }

      return res.json({
        mode: 'live',
        provider: 'henrik',
        player: {
          name: account.name || name,
          tag: account.tag || tag,
          region: playerRegion,
          accountLevel: account.account_level ?? null,
          lastUpdated: account.last_update || null,
          puuid: account.puuid || null,
          card: account.card || null,
          competitive: mmr
            ? {
                currentTier: mmr.current_data?.currenttierpatched || null,
                tierImage: mmr.current_data?.images?.small || null,
                rankingInTier: mmr.current_data?.ranking_in_tier ?? null,
                mmrChangeToLastGame: mmr.current_data?.mmr_change_to_last_game ?? null,
                elo: mmr.current_data?.elo ?? null,
                peakTier: mmr.highest_rank?.patched_tier || null,
                peakSeason: mmr.highest_rank?.season || null,
                recentActs: extractRecentActs(mmr.by_season)
              }
            : null
        }
      });
    }

    // Official Riot API path
    const riotHeaders = { 'X-Riot-Token': config.apiKey };
    const account = await fetchJson(
      `${RIOT_ACCOUNT_BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`,
      riotHeaders
    );

    return res.json({
      mode: 'live',
      provider: 'riot',
      player: {
        name: account.gameName || name,
        tag: account.tagLine || tag,
        region,
        puuid: account.puuid || null
      }
    });
  } catch (err) {
    return handleUpstreamError(res, err, 'fetch player profile');
  }
});

// Recent matches
app.get('/api/matches/:name/:tag', async (req, res) => {
  const name = req.params.name?.trim();
  const tag = req.params.tag?.trim();
  const region = (req.query.region || 'na').toString().trim().toLowerCase();
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 5, 1), 10);

  if (!name || !tag) {
    return res.status(400).json({ error: 'Both name and tag parameters are required.' });
  }

  const config = getApiConfig();
  if (config.provider === 'demo') {
    return res.json(buildDemoMatches(name, tag, region));
  }

  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);

  try {
    if (config.provider === 'henrik') {
      const headers = { Authorization: config.apiKey };
      let resolvedRegion = region;
      if (!resolvedRegion || resolvedRegion === 'auto') {
        const accountRes = await fetchJson(
          `${HENRIK_BASE_URL}/v1/account/${encodedName}/${encodedTag}`,
          headers
        );
        resolvedRegion = accountRes?.data?.region || 'na';
      }

      const matchRes = await fetchJson(
        `${HENRIK_BASE_URL}/v3/matches/${encodeURIComponent(resolvedRegion)}/${encodedName}/${encodedTag}?size=${size}`,
        headers
      );
      const rawMatches = Array.isArray(matchRes?.data) ? matchRes.data : [];

      const matches = rawMatches.map((m) => {
        const allPlayers = m.players?.all_players || [];
        const target = allPlayers.find(
          (p) =>
            p.name?.toLowerCase() === name.toLowerCase() &&
            p.tag?.toLowerCase() === tag.toLowerCase()
        );
        const teamKey = target?.team?.toLowerCase();
        const teamInfo = teamKey && m.teams ? m.teams[teamKey] : null;
        const roundsWon = teamInfo?.rounds_won ?? null;
        const roundsLost = teamInfo?.rounds_lost ?? null;
        const totalRounds =
          typeof roundsWon === 'number' && typeof roundsLost === 'number'
            ? roundsWon + roundsLost
            : Array.isArray(m.rounds)
              ? m.rounds.length
              : 0;

        return {
          matchId: m.metadata?.matchid || null,
          map: m.metadata?.map || null,
          mode: m.metadata?.mode || null,
          playedAt: m.metadata?.game_start_patched || null,
          durationSeconds: m.metadata?.game_length ?? null,
          server: m.metadata?.cluster || null,
          agent: target?.character || null,
          agentIcon: target?.assets?.agent?.small || null,
          stats: computeMatchStats(target, totalRounds),
          result: teamInfo ? (teamInfo.has_won ? 'Victory' : 'Defeat') : null,
          roundsWon,
          roundsLost
        };
      });

      return res.json({
        mode: 'live',
        provider: 'henrik',
        player: `${name}#${tag}`,
        region: resolvedRegion,
        count: matches.length,
        matches
      });
    }

    // Official Riot API path
    const riotHeaders = { 'X-Riot-Token': config.apiKey };
    const account = await fetchJson(
      `${RIOT_ACCOUNT_BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`,
      riotHeaders
    );
    const matchlist = await fetchJson(
      `${RIOT_VAL_BASE_URL}/val/match/v1/matchlists/by-puuid/${encodeURIComponent(account.puuid)}`,
      riotHeaders
    );

    return res.json({
      mode: 'live',
      provider: 'riot',
      player: `${account.gameName || name}#${account.tagLine || tag}`,
      region,
      count: (matchlist.history || []).slice(0, size).length,
      matches: (matchlist.history || []).slice(0, size)
    });
  } catch (err) {
    return handleUpstreamError(res, err, 'fetch match history');
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// For local testing only (Vercel imports the exported app directly)
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
