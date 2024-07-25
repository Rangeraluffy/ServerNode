const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { Parser } = require('json2csv');
const { create } = require('xmlbuilder2');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('#', { waitUntil: 'networkidle2' });
    const acceptCookiesButton = await page.$('#');
    if (acceptCookiesButton) {
      await acceptCookiesButton.click();
    }
    await page.waitForSelector('.#', { timeout: 60000 });
    const totalPages = await page.evaluate(() => {
      const totalPagesText = document.querySelector('.').innerText.trim();
      return parseInt(totalPagesText.split('/')[1], 10);
    });

    let allData = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      console.log(`Scraping page ${currentPage} of ${totalPages}`);
      const data = await page.evaluate(() => {
        const instruments = document.querySelectorAll('.#');
        const result = [];
        instruments.forEach(instrument => {
          const title = instrument.querySelector('.#-instrument')?.innerText.trim() || '';
          const isin = instrument.querySelector('.#')?.innerText.trim() || '';
          const logoElement = instrument.querySelector('.#-instrument img');
          const logo = logoElement ? logoElement.src : '';
          const lastQuotation = instrument.querySelector('.q#-last')?.innerText.trim() || '';
          const unit = instrument.querySelector('.#-unit')?.innerText.trim() || '';
          const variation = instrument.querySelector('.#-variation')?.innerText.trim() || '';
          const typeBadge = instrument.querySelector('.#')?.innerText.trim() || '';
          const detailsLinkElement = instrument.querySelector('.#');
          const detailsLink = detailsLinkElement ? detailsLinkElement.href : '';
          result.push({
            title,
            isin,
            logo,
            lastQuotation,
            unit,
            variation,
            typeBadge,
            detailsLink
          });
        });
        return result;
      });

      for (const item of data) {
        if (item.detailsLink) {
          const detailsPage = await browser.newPage();
          await detailsPage.goto(item.detailsLink, { waitUntil: 'networkidle2' });

          const historicalVariations = await detailsPage.evaluate(() => {
            const rows = document.querySelectorAll('.#');
            const variations = [];
            rows.forEach(row => {
              const cells = row.querySelectorAll('#');
              const period = cells[0]?.innerText.trim() || '';
              const value = cells[1]?.innerText.trim() || '';
              const variation = cells[2]?.innerText.trim() || '';
              if (['jour', '1 semaine', '1 mois', '3 mois', '6 mois', '1 an'].includes(period)) {
                variations.push({ period, value, variation });
              }
            });
            return variations;
          });

          await detailsPage.close();
          item.historicalVariations = historicalVariations;
        }
      }

      allData = allData.concat(data);
      if (currentPage < totalPages) {
        await page.click('.#');
        await page.waitForSelector('.#', { timeout: 60000 });
      }
    }
    await fs.writeFile('stocks.json', JSON.stringify(allData, null, 2));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(allData);
    await fs.writeFile('stocks.csv', csv);

    const root = create({ version: '1.0' }).ele('stocks');
    allData.forEach(item => {
      const stock = root.ele('stock');
      Object.keys(item).forEach(key => {
        if (key === '#') {
          const variations = stock.ele('#');
          item[key].forEach(variation => {
            const variationEle = variations.ele('#');
            Object.keys(variation).forEach(vKey => {
              variationEle.ele(vKey).txt(variation[vKey]);
            });
          });
        } else {
          stock.ele(key).txt(item[key]);
        }
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
