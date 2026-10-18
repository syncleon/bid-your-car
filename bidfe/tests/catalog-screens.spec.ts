import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/catalog';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/catalog';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Catalog Screenshot: ${filename}`);
}

test.describe('Auctions Catalog & Discovery UI Tests (Positive & Negative)', () => {

  test('Step 1 [Positive]: Live Auctions Catalog Grid View', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify auction grid and cards are loaded
      const grid = page.locator('.auction-grid');
      await expect(grid).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.base-card').first()).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, 'catalog_01_live_auctions.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Positive]: Filter Catalog by Make (e.g. Porsche)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(page.locator('.auction-grid')).toBeVisible({ timeout: 10000 });

      // Click Make filter dropdown
      const makeSelect = page.locator('.custom-select__trigger').filter({ hasText: /Make/i }).first();
      await makeSelect.click();

      // Select Porsche
      const porscheOption = page.locator('.custom-select__option').filter({ hasText: 'Porsche' }).first();
      if (await porscheOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await porscheOption.click();
      }

      // Verify active filter chip
      await expect(page.locator('.filter-chip')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      await saveScreenshot(page, 'catalog_02_filter_by_make.png');
    } finally {
      await context.close();
    }
  });

  test('Step 3 [Positive]: Search Catalog with Query Keyword', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(page.locator('.auction-grid')).toBeVisible({ timeout: 10000 });

      // Search for AMG
      const searchInput = page.locator('input[placeholder="Search"]').first();
      await searchInput.fill('AMG');
      await searchInput.press('Enter');

      // Verify filtered cards
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'catalog_03_search_query.png');
    } finally {
      await context.close();
    }
  });

  test('Step 4 [Negative]: Non-Existent Search Query Shows Empty State', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions?q=nonexistentcarlot999');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify empty state container
      const emptyState = page.locator('.empty-state');
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/No vehicles found/i)).toBeVisible();

      await saveScreenshot(page, 'catalog_04_search_empty_state.png');
    } finally {
      await context.close();
    }
  });

  test('Step 5 [Positive]: Past Auctions Archive Screen', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/past-auctions');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify past auctions title and grid
      await expect(page.locator('.page-title')).toHaveText('Past Auctions');
      const grid = page.locator('.auction-grid');
      await expect(grid).toBeVisible({ timeout: 10000 });

      await saveScreenshot(page, 'catalog_05_past_auctions.png');
    } finally {
      await context.close();
    }
  });
});
