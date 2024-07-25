const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { Parser } = require('json2csv');
const { create } = require('xmlbuilder2');

(async () => {
  const browser = await puppeteer.launch({ headless: true }); 
  const page = await browser.newPage();

  try {
    await page.goto('', {
      waitUntil: 'networkidle2' 
    });

    await page.waitForSelector('.c-table');

    // Extract Data 
    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll('.c-table__row');
      const result = [];

      rows.forEach(row => {
        const columns = row.querySelectorAll('.c-table__cell');
        if (columns.length) {
          const stockData = {
            libelle: columns[0].innerText.trim(), 
            var: columns[3].innerText.trim(),
            perf_annees: columns[4].innerText.trim(),
            risques: `${columns[5].innerText.trim()}`,
            stars: `${columns[6].innerText.trim()}/5`, 
          };
          result.push(stockData);
        }
      });

      return result;
    });

    // Write JSON
    await fs.writeFile('stocks.json', JSON.stringify(data, null, 2));

    // Convert CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);
    await fs.writeFile('stocks.csv', csv);

    // Convert XML
    const root = create({ version: '1.0' }).ele('stocks');
    data.forEach(item => {
      const stock = root.ele('stock');
      Object.keys(item).forEach(key => {
        stock.ele(key).txt(item[key]);
      });
    });
    const xml = root.end({ prettyPrint: true });
    await fs.writeFile('stocks.xml', xml);

    console.log('Données extraites et sauvegardées dans stocks.json, stocks.csv, et stocks.xml');

  } catch (error) {
    console.error('Erreur lors du scraping:', error);
  } finally {
    await browser.close();
  }
})();
