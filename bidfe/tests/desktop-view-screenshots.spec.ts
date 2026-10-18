import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/desktop-views';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/desktop-views';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Desktop Screenshot: ${filename}`);
}

test.describe('Desktop Auction View Screenshots (1440x900 & 1920x1080)', () => {
  // Target active car auction: 2010 Mercedes-Benz AMG GT
  const targetLotId = '5dd616b4-c4bd-4bed-b704-2d09bf3cc225';

  test('Capture Dedicated Desktop Views', async ({ browser }) => {
    // 1. Create standard desktop context (1440x900 Retina 2x)
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });

    // Authenticate user to render active bidding controls
    const loginRes = await context.request.post('http://localhost:8080/api/v1/auth/login', {
      data: { username: 'turbo_collector', password: 'password123' },
    });
    if (loginRes.ok()) {
      const data = await loginRes.json();
      await context.addInitScript((token) => {
        localStorage.setItem('auth_token', token);
      }, data.token);
    }

    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${targetLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(page.locator('.auction-sidebar')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000); // Allow fonts, gallery, and layout to settle

      // 1. Desktop Above-the-Fold Viewport (1440x900)
      await saveScreenshot(page, 'desktop_01_hero_viewport.png', { fullPage: false });

      // 2. Full Page Desktop Screenshot (entire scrollable document)
      await saveScreenshot(page, 'desktop_02_full_page.png', { fullPage: true });

      // 3. Focused Desktop Bidding Card & Sticky Sidebar
      const sidebar = page.locator('.auction-sidebar');
      await saveScreenshot(sidebar, 'desktop_03_bidding_card_detail.png');

      // 4. Desktop Vehicle Specifications & Overview Section
      const mainContent = page.locator('.auction-main-content');
      if (await mainContent.isVisible().catch(() => false)) {
        await saveScreenshot(mainContent, 'desktop_04_vehicle_specs_and_details.png');
      }

      // 5. Desktop High-Res Gallery Section
      const gallery = page.locator('.gallery-section');
      if (await gallery.isVisible().catch(() => false)) {
        await saveScreenshot(gallery, 'desktop_05_gallery_section.png');
      }

      // Visual pause for headed observation
      await page.waitForTimeout(2000);
    } finally {
      await context.close();
    }
  });
});
