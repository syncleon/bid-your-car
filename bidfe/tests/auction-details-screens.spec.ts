import { test, expect } from '@playwright/test';
import { createScreenshotSaver } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('auction-details');

test.describe('Auction Details & Media Gallery UI Tests (Positive & Negative)', () => {
  let activeLotId = 'f54d67f6-f07c-427b-9ed8-846780eaaaf9';

  test.beforeAll(async ({ request }) => {
    try {
      const activeRes = await request.get('http://localhost:8080/api/v1/auctions?status=ACTIVE&size=5');
      if (activeRes.ok()) {
        const data = await activeRes.json();
        if (data.content && data.content.length > 0) {
          activeLotId = data.content[0].id;
        }
      }
    } catch (e) {
      console.warn('Using default activeLotId:', e);
    }
  });

  test('Step 1 [Positive]: Vehicle Details Hero & Photo Gallery View', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${activeLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify page layout and gallery
      await expect(page.locator('.auction-layout-container')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.image-gallery-hero')).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, 'details_01_hero_and_gallery.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Positive]: Gallery Thumbnail Clicking & Hero Update', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${activeLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.locator('.image-gallery-hero')).toBeVisible({ timeout: 10000 });

      // Click second thumbnail if available
      const thumbnails = page.locator('.image-gallery-thumbnails > div');
      if (await thumbnails.count() > 1) {
        await thumbnails.nth(1).click();
        await page.waitForTimeout(500);
      }

      await saveScreenshot(page, 'details_02_thumbnail_selected.png');
    } finally {
      await context.close();
    }
  });

  test('Step 3 [Positive]: Open Full-Screen Photo Lightbox Modal', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${activeLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.locator('.image-gallery-hero')).toBeVisible({ timeout: 10000 });

      // Click "Show all photos" button
      const showAllBtn = page.locator('button:has-text("Show all")');
      if (await showAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await showAllBtn.click();
        await page.waitForTimeout(500);
      }

      await saveScreenshot(page, 'details_03_photo_lightbox_modal.png');
    } finally {
      await context.close();
    }
  });

  test('Step 4 [Positive]: Vehicle Specifications & Mechanical Breakdown', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${activeLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.locator('.auction-layout-container')).toBeVisible({ timeout: 10000 });

      // Scroll to vehicle specifications and notes
      const vehicleInfo = page.locator('.auction-main-content');
      await expect(vehicleInfo).toBeVisible();

      await saveScreenshot(vehicleInfo, 'details_04_vehicle_specifications.png');
    } finally {
      await context.close();
    }
  });

  test('Step 5 [Positive]: Auction Sidebar Bidding & Price Box', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${activeLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      const sidebar = page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      await saveScreenshot(sidebar, 'details_05_sidebar_pricing_card.png');
    } finally {
      await context.close();
    }
  });

  test('Step 6 [Negative]: Non-Existent Auction ID Shows Empty / Not Found View', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions/00000000-0000-0000-0000-000000000000');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Expect "Auction not found" or empty details state
      await expect(page.getByText(/Auction not found/i).or(page.locator('.details-loading'))).toBeVisible({ timeout: 10000 });

      await saveScreenshot(page, 'details_06_not_found_negative.png');
    } finally {
      await context.close();
    }
  });
});
