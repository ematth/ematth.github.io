const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');
require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local

const app = express();
const port = 8000;

const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;


const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token,
    }),
  });

  return response.json();
};

const getNowPlaying = async () => {
  const { access_token } = await getAccessToken();

  return fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

// This is your API endpoint
app.get('/api/spotify', async (_, res) => {
  try {
    const response = await getNowPlaying();

    if (response.status === 204 || response.status > 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();

    if (!song || song.currently_playing_type !== 'track') {
      return res.status(200).json({ isPlaying: false });
    }

    const data = {
      isPlaying: song.is_playing,
      title: song.item.name,
      album: song.item.album.name,
      artist: song.item.artists.map((artist) => artist.name).join(', '),
      albumImageUrl: song.item.album.images[0].url,
      songUrl: song.item.external_urls.spotify,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error in /api/spotify endpoint:', error);
    res.status(500).json({ isPlaying: false, error: 'Internal Server Error' });
  }
});

// Serve all your static files from the root directory
app.use(express.static('.'));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
