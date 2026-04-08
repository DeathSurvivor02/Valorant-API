const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Valorant API',
    endpoints: {
      player: '/api/player/:name/:tag',
      matches: '/api/matches/:name/:tag'
    }
  });
});

app.get('/api/player/:name/:tag', (req, res) => {
  const { name, tag } = req.params;
  // Placeholder logic for Riot API integration
  res.json({
    name,
    tag,
    message: `Profile data for ${name}#${tag} will be retrieved from Riot API`
  });
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
