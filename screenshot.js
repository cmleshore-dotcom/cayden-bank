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

  // 1. Clean login screen
  console.log('1. Login screen...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${dir}/01-login.png` });

  // 2. Inject tokens and go to the app
  await page.evaluate(({ t, rt }) => {
    localStorage.setItem('cb_access', t);
    localStorage.setItem('cb_refresh', rt);
  }, { t: token, rt: refreshToken });

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  // Wait for the home screen to actually render (init() calls /auth/me then shows home)
  await page.waitForTimeout(2000);

  // Wait until the home-screen is visible
  await page.waitForFunction(() => {
    const el = document.getElementById('home-screen');
    return el && el.style.display !== 'none';
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Now hide the login/register screens that sit above in the DOM
  // and only show the active screen
  await page.evaluate(() => {
    // Force hide auth screens
    const login = document.getElementById('login-screen');
    const register = document.getElementById('register-screen');
    if (login) login.style.display = 'none';
    if (register) register.style.display = 'none';
    // Scroll to top
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  // 3. Home screen
  console.log('2. Home dashboard...');
  await page.screenshot({ path: `${dir}/02-home.png` });
  // Scroll down for full transaction list
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/02-home-scrolled.png` });
  await page.evaluate(() => window.scrollTo(0, 0));

  // Helper
  const captureTab = async (tabName, num, fileName) => {
    console.log(`${num}. ${tabName}...`);
    await page.evaluate((tab) => {
      navigateTab(tab);
      window.scrollTo(0, 0);
    }, tabName);
    await page.waitForTimeout(2000);
    // Hide auth screens again
    await page.evaluate(() => {
      const login = document.getElementById('login-screen');
      const register = document.getElementById('register-screen');
      if (login) login.style.display = 'none';
      if (register) register.style.display = 'none';
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${fileName}.png` });
    // Scroll down for more content
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${fileName}-scroll.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
  };

  await captureTab('budget', 3, '03-budget');
  await captureTab('extracash', 4, '04-extracash');
  await captureTab('goals', 5, '05-goals');
  await captureTab('more', 6, '06-more');

  await browser.close();
  console.log('All done!');
})();
