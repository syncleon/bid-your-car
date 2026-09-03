import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[pageerror] ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`[requestfailed] ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log("Navigating to http://localhost:5173/");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  // Wait a bit to ensure async operations complete
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
