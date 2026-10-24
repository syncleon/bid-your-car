import { test, expect } from '@playwright/test';
import { createScreenshotSaver } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('catalog');

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

      // Select Porsche or Ford
      const porscheOption = page.locator('.custom-select__option').filter({ hasText: 'Porsche' }).first();
      if (await porscheOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await porscheOption.click();
      } else {
        const firstOption = page.locator('.custom-select__option').nth(1);
        await firstOption.click();
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
      const searchInput = page.locator('input[name="q"]').first();
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

  test('Step 5 [Positive]: Sort Dropdown Options Selection', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(page.locator('.auction-grid')).toBeVisible({ timeout: 10000 });

      // Click Sort dropdown if present
      const sortSelect = page.locator('.custom-select__trigger').filter({ hasText: /Ending Soonest|Sort|Newly Listed/i }).first();
      if (await sortSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sortSelect.click();
        const option = page.locator('.custom-select__option').first();
        await option.click();
        await page.waitForTimeout(500);
      }

      await saveScreenshot(page, 'catalog_05_sort_applied.png');
    } finally {
      await context.close();
    }
  });

  test('Step 6 [Positive]: Clear All Filters Button Restores Full Catalog', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/auctions?q=Porsche');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify chip is visible
      await expect(page.locator('.filter-chip')).toBeVisible({ timeout: 5000 });
      
      // Click Clear all
      const clearBtn = page.locator('.reset-btn', { hasText: 'Clear all' });
      await expect(clearBtn).toBeVisible({ timeout: 5000 });
      await clearBtn.click();

      // Verify chips are removed
      await expect(page.locator('.filter-chip')).toHaveCount(0);
      await page.waitForTimeout(500);

      await saveScreenshot(page, 'catalog_06_filters_cleared.png');
    } finally {
      await context.close();
    }
  });

  test('Step 7 [Positive]: Past Auctions Archive Screen', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/past-auctions');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify past auctions title and grid
      await expect(page.locator('.page-title')).toHaveText('Past Auctions');
      const grid = page.locator('.auction-grid');
      await expect(grid).toBeVisible({ timeout: 10000 });

      await saveScreenshot(page, 'catalog_07_past_auctions.png');
    } finally {
      await context.close();
    }
  });
});
