const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.get('/api', async (req, res) => {
  try {
    const response = await axios.get('URL_API');
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Route pour faire du scraping
app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get('URL_SCRAPER');
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
