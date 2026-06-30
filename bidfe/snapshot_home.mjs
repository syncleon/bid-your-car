import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/syncleon/.gemini/antigravity/brain/d2cc8e98-7901-45c7-9791-3b110a71b361/snap_home.png', fullPage: true });
  console.log('Home saved');

  await browser.close();
})();
