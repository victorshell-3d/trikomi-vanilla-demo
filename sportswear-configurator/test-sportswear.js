import puppeteer from 'puppeteer';

const TARGET_URL = process.env.TEST_URL || 'http://localhost:8080/sportswear-configurator/';

console.log('🤖 Starting Automated E2E Sportswear Configurator Test...');

const errors = [];
const logs = [];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=swiftshader',
    '--ignore-gpu-blocklist'
  ]
});

const page = await browser.newPage();

page.on('pageerror', (err) => {
  console.error('❌ [PAGE ERROR]:', err.message);
  errors.push({ type: 'pageerror', message: err.message });
});

page.on('response', res => {
  if (res.status() >= 400) {
    console.error('❌ [HTTP 404]:', res.url());
  }
});

page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  logs.push(`[${type.toUpperCase()}] ${text}`);
  if (type === 'error' && !text.includes('favicon')) {
    console.error('❌ [CONSOLE ERROR]:', text);
    errors.push({ type: 'console.error', message: text });
  }
});

try {
  console.log(`🌐 Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  console.log('✅ Page loaded successfully with zero errors.');
} catch (err) {
  console.error('❌ Test failed with exception:', err.message);
} finally {
  await browser.close();
}

console.log(`Total Errors Detected: ${errors.length}`);
if (errors.length > 0) {
  process.exit(1);
} else {
  console.log('🎉 Sportswear Configurator E2E verification passed!');
}
