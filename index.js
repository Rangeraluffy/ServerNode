require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;

app.get('/api', async (req, res) => {
  try {
    const response = await axios.get(`https://api.example.com/data?key=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get(`https://api.example.com/data?key=${apiKey}`);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const articles = [];
    $('').each((index, element) => {
      articles.push({
        title: $(element).text(),
      });
    });

    res.json(articles);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Node.js démarré sur le port ${PORT}`);
});
