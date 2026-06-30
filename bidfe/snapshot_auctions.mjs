import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await page.goto('http://localhost:5173/auctions');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/syncleon/.gemini/antigravity/brain/d2cc8e98-7901-45c7-9791-3b110a71b361/snap_auctions.png', fullPage: false });
  console.log('Auctions saved');

  await page.goto('http://localhost:5173/auctions/623d9ba6-68c3-45bb-aadc-11b290bb5a8e');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/syncleon/.gemini/antigravity/brain/d2cc8e98-7901-45c7-9791-3b110a71b361/snap_details.png', fullPage: false });
  console.log('Details saved');

  await browser.close();
})();
