const puppeteer = require('puppeteer');

(async () => {

  const browser = await puppeteer.launch({ headless: true }); 
  const page = await browser.newPage();

  await page.goto('', {
    waitUntil: 'networkidle2' 
  });

  await page.waitForSelector('.c-table');

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll('.c-table__row');
    const result = [];

    rows.forEach(row => {
      const columns = row.querySelectorAll('.c-table__cell');
      if (columns.length) {
        const stockData = {
          symbol: columns[0].innerText.trim(), 
          price: columns[1].innerText.trim(),  
          change: columns[2].innerText.trim(), 
        };
        result.push(stockData);
      }
    });

    return result;
  });

  console.log(data);

  await browser.close();
})();
