import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const CONV_ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/2114084e-7648-4201-98e1-f3dd962520c7/screenshots';
const LOCAL_DESKTOP_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/desktop-views';
const LOCAL_MOBILE_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/mobile-views';

fs.mkdirSync(path.join(CONV_ARTIFACT_DIR, 'desktop'), { recursive: true });
fs.mkdirSync(path.join(CONV_ARTIFACT_DIR, 'mobile'), { recursive: true });
fs.mkdirSync(LOCAL_DESKTOP_DIR, { recursive: true });
fs.mkdirSync(LOCAL_MOBILE_DIR, { recursive: true });

async function saveDesktopScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(CONV_ARTIFACT_DIR, 'desktop', filename);
  const localPath = path.join(LOCAL_DESKTOP_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Desktop: ${filename}`);
}

async function saveMobileScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(CONV_ARTIFACT_DIR, 'mobile', filename);
  const localPath = path.join(LOCAL_MOBILE_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Mobile: ${filename}`);
}

test.describe('Responsive UI Inspection (Desktop & Mobile)', () => {
  const targetLotId = '5dd616b4-c4bd-4bed-b704-2d09bf3cc225';

  test('Desktop Screenshots (1440x900)', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });

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

    // 1. Catalog Page (Grid)
    await page.goto('/auctions');
    await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
    await expect(page.locator('.auction-grid')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await saveDesktopScreenshot(page, 'desktop_catalog_viewport.png', { fullPage: false });
    await saveDesktopScreenshot(page, 'desktop_catalog_fullpage.png', { fullPage: true });

    // Focus on first auction card
    const firstCard = page.locator('.base-card').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await saveDesktopScreenshot(firstCard, 'desktop_auction_card_detail.png');
    }

    // 2. Auction Details Page
    await page.goto(`/auctions/${targetLotId}`);
    await page.waitForTimeout(1500);
    await saveDesktopScreenshot(page, 'desktop_auction_details_viewport.png', { fullPage: false });
    await saveDesktopScreenshot(page, 'desktop_auction_details_fullpage.png', { fullPage: true });

    // Focus on bidding sidebar
    const biddingCard = page.locator('.auction-sidebar');
    if (await biddingCard.isVisible().catch(() => false)) {
      await saveDesktopScreenshot(biddingCard, 'desktop_bidding_sidebar.png');
    }

    // 3. Sell Car Page
    await page.goto('/sell-car');
    await page.waitForTimeout(800);
    await saveDesktopScreenshot(page, 'desktop_sell_car.png', { fullPage: false });

    // 4. User Profile Page
    await page.goto('/profile');
    await page.waitForTimeout(800);
    await saveDesktopScreenshot(page, 'desktop_profile.png', { fullPage: false });

    await context.close();
  });

  test('Mobile Screenshots (390x844 iPhone 14)', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

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

    // 1. Mobile Catalog Page
    await page.goto('/auctions');
    await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
    await expect(page.locator('.auction-grid')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await saveMobileScreenshot(page, 'mobile_catalog_viewport.png', { fullPage: false });
    await saveMobileScreenshot(page, 'mobile_catalog_fullpage.png', { fullPage: true });

    // Focus on first mobile card
    const firstCard = page.locator('.base-card').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await saveMobileScreenshot(firstCard, 'mobile_auction_card_detail.png');
    }

    // Mobile Navbar Menu open
    const menuBtn = page.locator('.mobile-menu-trigger');
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(400);
      await saveMobileScreenshot(page, 'mobile_nav_menu_open.png', { fullPage: false });
      const closeBtn = page.locator('.mobile-close-btn');
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 2. Mobile Auction Details Page
    await page.goto(`/auctions/${targetLotId}`);
    await page.waitForTimeout(1500);
    await saveMobileScreenshot(page, 'mobile_auction_details_viewport.png', { fullPage: false });
    await saveMobileScreenshot(page, 'mobile_auction_details_fullpage.png', { fullPage: true });

    // Focus on mobile bidding card
    const mobileSidebar = page.locator('.auction-sidebar');
    if (await mobileSidebar.isVisible().catch(() => false)) {
      await saveMobileScreenshot(mobileSidebar, 'mobile_bidding_sidebar.png');
    }

    // 3. Mobile Sell Car Page
    await page.goto('/sell-car');
    await page.waitForTimeout(800);
    await saveMobileScreenshot(page, 'mobile_sell_car.png', { fullPage: false });

    // 4. Mobile Profile Page
    await page.goto('/profile');
    await page.waitForTimeout(800);
    await saveMobileScreenshot(page, 'mobile_profile.png', { fullPage: false });

    await context.close();
  });
});
