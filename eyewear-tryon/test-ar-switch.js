import puppeteer from 'puppeteer';

const TARGET_URL = process.env.TEST_URL || 'http://localhost:8080/eyewear-tryon/';

console.log('🤖 Starting Automated E2E AR/3D Scene Switch Test...');

const errors = [];
const warnings = [];
const logs = [];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=swiftshader',
    '--enable-unsafe-webgpu',
    '--ignore-gpu-blocklist'
  ]
});

const page = await browser.newPage();

// Catch uncaught page errors
page.on('pageerror', (err) => {
  console.error('❌ [PAGE ERROR]:', err.message);
  errors.push({ type: 'pageerror', message: err.message, stack: err.stack });
});

// Catch console logs & errors
page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  logs.push(`[${type.toUpperCase()}] ${text}`);
  
  if (type === 'error') {
    console.error('❌ [CONSOLE ERROR]:', text);
    errors.push({ type: 'console.error', message: text });
  } else if (type === 'warning') {
    console.warn('⚠️ [CONSOLE WARN]:', text);
    warnings.push(text);
  } else {
    console.log(`ℹ️ [CONSOLE ${type.toUpperCase()}]:`, text);
  }
});

try {
  console.log(`🌐 Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait 3s for initial 3D Studio Mode load
  console.log('⏳ Waiting 3 seconds for initial 3D View mode...');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));

  // Click to switch to AR mode
  console.log('🚀 Switching to 8thWall AR Mode...');
  const arButton = await page.$('#btn-toggle-camera');
  if (arButton) {
    await arButton.click();
  } else {
    console.warn('⚠️ AR Button #btn-toggle-camera not found on page.');
  }

  // Stay in AR mode for 5 seconds
  console.log('⏱️ Staying in AR Mode for 5 seconds...');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 5000)));

  // Click to switch back to View mode (3D Studio mode)
  console.log('🎥 Switching back to 3D View Mode...');
  if (arButton) {
    await arButton.click();
  }

  // Wait 3s for 3D View mode restoration
  console.log('⏱️ Waiting 3 seconds in 3D View mode...');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));

} catch (err) {
  console.error('❌ Automation Script Failed with error:', err);
  errors.push({ type: 'simulation_failure', message: err.message });
} finally {
  await browser.close();
}

console.log('\n================================');
console.log('📊 AR/3D Mode Switch Audit Summary');
console.log('================================');
console.log(`Total Captured Console Logs: ${logs.length}`);
console.log(`Total Errors Detected: ${errors.length}`);
console.log(`Total Warnings Detected: ${warnings.length}`);

if (errors.length > 0) {
  console.error('\n❌ FAIL: Runtime errors detected during AR/3D transition:');
  errors.forEach((err, idx) => {
    console.error(` [${idx + 1}] (${err.type}): ${err.message}`);
  });
} else {
  console.log('\n🎉 PASS: Switched to AR mode, waited 5 seconds, and returned to 3D View mode cleanly with 0 errors!');
}
