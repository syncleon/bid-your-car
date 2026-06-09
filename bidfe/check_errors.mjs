import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    page.on('response', response => {
        if (response.url().includes('/api/v1/auth/login')) {
            console.log(`Login response status: ${response.status()}`);
        }
    });

    try {
        console.log("Navigating to login page...");
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        
        console.log("Filling in credentials...");
        await page.fill('input[name="username_field"]', 'admin');
        await page.fill('input[name="password_field"]', 'admin123');
        
        console.log("Submitting login form...");
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000); // wait for login to complete

        console.log("Current URL after login:", page.url());

        console.log("Navigating to admin panel...");
        await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'admin_page.png' });
        console.log("Screenshot saved to admin_page.png");
        
    } catch (e) {
        console.error("Failed during test:", e);
    } finally {
        await browser.close();
    }
})();
