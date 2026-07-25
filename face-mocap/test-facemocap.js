import puppeteer from 'puppeteer';

const TARGET_URL = process.env.TEST_URL || 'http://localhost:8080/face-mocap/';

console.log('🤖 Starting Automated E2E Face Mocap Demo Test...');

const errors = [];
const logs = [];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=swiftshader',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--ignore-gpu-blocklist'
  ]
});

const page = await browser.newPage();

page.on('pageerror', (err) => {
  console.error('❌ [PAGE ERROR]:', err.message);
  errors.push({ type: 'pageerror', message: err.message });
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
  console.log('✅ Page loaded successfully.');
} catch (err) {
  console.error('❌ Test failed with exception:', err.message);
} finally {
  await browser.close();
}

console.log(`Total Errors Detected: ${errors.length}`);
if (errors.length > 0) {
  process.exit(1);
} else {
  console.log('🎉 Face Mocap Vanilla Demo E2E verification passed!');
}
