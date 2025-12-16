const { chromium } = require('@playwright/test');

const pages = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/dashboard',
  '/strategies/leaderboard'
];

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

(async () => {
  console.log('\n🚀 Starting screenshot automation...\n');
  
  const browser = await chromium.launch();

  for (const viewport of viewports) {
    console.log(`\n📸 Capturing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const path of pages) {
      const url = `http://localhost:3000${path}`;
      const fileName = path.replace(/\//g, '_').substring(1) || 'home';
      const screenshotPath = `uxui-audit/baseline/${viewport.name}_${fileName}.png`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ✓ ${fileName}`);
      } catch (error) {
        console.log(`  ✗ ${fileName} (${error.message})`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ All screenshots captured!\n');
})();
