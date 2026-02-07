const { chromium } = require('playwright-core');
const fs = require('fs');
const http = require('http');

function apiCall(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request({ hostname: 'localhost', port: 3000, path, method, headers }, res => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve(JSON.parse(result)));
    });
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

(async () => {
  // Login via API
  console.log('Logging in via API...');
  const loginResult = await apiCall('/api/auth/login', 'POST', {
    email: 'cayden@example.com',
    password: 'Password123!',
  });
  const token = loginResult.data.accessToken;
  const refreshToken = loginResult.data.refreshToken;
  console.log('Login success!');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
      '--disable-dev-shm-usage', '--disable-software-rasterizer', '--single-process',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const BASE = 'http://localhost:3000';
  const dir = '/home/user/cayden-bank/screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Login screen (clean)
  console.log('1. Capturing login screen...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/01-login.png` });
  console.log('   Done.');

  // 2. Set localStorage tokens BEFORE navigating, using addInitScript
  //    Then reload so init() picks them up
  console.log('2. Authenticating...');
  await page.evaluate(({ t, rt }) => {
    localStorage.setItem('cb_access', t);
    localStorage.setItem('cb_refresh', rt);
  }, { t: token, rt: refreshToken });

  // Now reload - the init() will find the tokens in localStorage, call /auth/me, and show home
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // 3. Home screen
  console.log('3. Capturing Home...');
  await page.screenshot({ path: `${dir}/02-home.png` });
  await page.screenshot({ path: `${dir}/02-home-full.png`, fullPage: true });
  console.log('   Done.');

  // Helper to wait for screen transition
  const captureTab = async (tabName, num, fileName) => {
    console.log(`${num}. Capturing ${tabName}...`);
    await page.evaluate((tab) => navigateTab(tab), tabName);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/${fileName}.png` });
    await page.screenshot({ path: `${dir}/${fileName}-full.png`, fullPage: true });
    console.log('   Done.');
  };

  await captureTab('budget', 4, '03-budget');
  await captureTab('extracash', 5, '04-extracash');
  await captureTab('goals', 6, '05-goals');
  await captureTab('more', 7, '06-more');

  await browser.close();
  console.log('\nAll screenshots saved!');
})();
