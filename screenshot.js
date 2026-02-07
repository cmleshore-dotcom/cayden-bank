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

  // 1. Login screen
  console.log('1. Login screen...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/01-login.png` });

  // 2. Inject tokens
  await page.evaluate(({ t, rt }) => {
    localStorage.setItem('cb_access', t);
    localStorage.setItem('cb_refresh', rt);
  }, { t: token, rt: refreshToken });

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Wait for home screen
  await page.waitForFunction(() => {
    const el = document.getElementById('home-screen');
    return el && el.classList.contains('active');
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Hide auth screens
  const hideAuth = async () => {
    await page.evaluate(() => {
      const l = document.getElementById('login-screen');
      const r = document.getElementById('register-screen');
      if (l) l.style.display = 'none';
      if (r) r.style.display = 'none';
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
  };

  await hideAuth();

  // 3. Home
  console.log('2. Home...');
  await page.screenshot({ path: `${dir}/02-home.png` });
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/02-home-scrolled.png` });

  const captureTab = async (tabName, num, fileName) => {
    console.log(`${num}. ${tabName}...`);
    await page.evaluate((tab) => { navigateTab(tab); window.scrollTo(0, 0); }, tabName);
    await page.waitForTimeout(2000);
    await hideAuth();
    await page.screenshot({ path: `${dir}/${fileName}.png` });
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${fileName}-scroll.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
  };

  await captureTab('budget', 3, '03-budget');
  await captureTab('extracash', 4, '04-extracash');
  await captureTab('goals', 5, '05-goals');
  await captureTab('more', 6, '06-more');

  // 7. Chat modal
  console.log('7. Chat modal...');
  await page.evaluate(() => openModal('chat'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${dir}/07-chat.png` });
  await page.evaluate(() => closeModal());
  await page.waitForTimeout(500);

  // 8. Side Hustles modal
  console.log('8. Side Hustles...');
  await page.evaluate(() => openModal('side-hustles'));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${dir}/08-sidehustles.png` });
  await page.evaluate(() => closeModal());
  await page.waitForTimeout(500);

  // 9. Profile modal
  console.log('9. Profile...');
  await page.evaluate(() => openModal('profile'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/09-profile.png` });
  await page.evaluate(() => closeModal());
  await page.waitForTimeout(500);

  // 10. Security modal
  console.log('10. Security...');
  await page.evaluate(() => openModal('security'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/10-security.png` });

  await browser.close();
  console.log('\nAll screenshots saved!');
})();
