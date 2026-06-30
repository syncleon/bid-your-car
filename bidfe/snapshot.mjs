import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/auctions/623d9ba6-68c3-45bb-aadc-11b290bb5a8e');
  
  // Wait for the page to load
  await page.waitForTimeout(1500);

  // Attempt to click the cookie accept button if it exists
  try {
    const cookieBtn = await page.locator('button:has-text("Accept")').first();
    if (await cookieBtn.isVisible()) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  await page.screenshot({ path: '/Users/syncleon/.gemini/antigravity/brain/d2cc8e98-7901-45c7-9791-3b110a71b361/screenshot3.png', fullPage: true });
  await browser.close();
  console.log('Screenshot 3 saved');
})();
