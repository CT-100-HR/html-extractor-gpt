const express = require('express');
const puppeteer = require('puppeteer-core');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const chromiumPath = "/usr/bin/chromium"; // Fallback for Render environments

app.post('/extract-html', async (req, res) => {
  const { url, selector } = req.body;

  if (!url || !selector) {
    return res.status(400).json({ error: 'Missing URL or selector' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--single-process',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-background-timer-throttling'
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.outerHTML : null;
    }, selector);

    await browser.close();

    if (!html) {
      return res.status(404).json({ error: 'Element not found' });
    }

    res.json({ html });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract HTML', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
