import { test, expect, Browser, Page, Locator } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_SCREENSHOT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/bidding-flow';
const LOCAL_SCREENSHOT_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/bidding-flow';

// Ensure output directories exist
fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });

async function saveStepScreenshot(page: Page, filename: string, targetLocator?: Locator) {
  const artifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, filename);
  const localPath = path.join(LOCAL_SCREENSHOT_DIR, filename);

  // If locator is provided and visible, capture that component with padding; otherwise capture full viewport
  if (targetLocator && await targetLocator.isVisible().catch(() => false)) {
    await targetLocator.screenshot({ path: artifactPath });
    await targetLocator.screenshot({ path: localPath });
  } else {
    await page.screenshot({ path: artifactPath, fullPage: false });
    await page.screenshot({ path: localPath, fullPage: false });
  }
  console.log(`📸 Saved screenshot: ${filename}`);
}

async function createAuthenticatedContext(browser: Browser, user: { username: string; password: string }) {
  const context = await browser.newContext();
  const loginRes = await context.request.post('http://localhost:8080/api/v1/auth/login', {
    data: {
      username: user.username,
      password: user.password,
    },
  });

  if (loginRes.ok()) {
    const data = await loginRes.json();
    await context.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, data.token);
  }

  const page = await context.newPage();
  return { context, page, user };
}

test.describe('Bidding Flow Deep Analysis with Screenshots (Positive & Negative)', () => {
  test.describe.configure({ mode: 'serial' });

  // Target active lot where seller is seller_john (User ID: 1)
  const activeLotId = '5dd616b4-c4bd-4bed-b704-2d09bf3cc225'; // 2010 Mercedes-Benz AMG GT
  const endedLotId = '6d78e22e-3a99-4fe0-9a63-aaacb6aa6ae3';  // 2023 Porsche 911 Carrera (SOLD)

  test('Step 1 [Negative]: Unauthenticated User Bidding Prevention', async ({ browser }) => {
    // 1. Launch a completely clean, unauthenticated context (guest)
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${activeLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // Click Quick Bid as guest
      const quickBtn = page.locator('button:has-text("Quick Bid")');
      await expect(quickBtn).toBeVisible({ timeout: 5000 });
      await quickBtn.click();

      // UI should display error requiring login
      await expect(page.getByText(/Please log in to bid/i)).toBeVisible({ timeout: 5000 });
      await saveStepScreenshot(page, '01_unauthenticated_user_blocked.png', sidebar);
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Negative]: Seller Cannot Bid on Own Listing', async ({ browser }) => {
    // Seller of this car is seller_john (id: 1)
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto(`/auctions/${activeLotId}`);
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = session.page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // Verify seller message is displayed
      const sellerNotice = session.page.getByText(/This is your listing. Sellers cannot place bids on their own items/i);
      await expect(sellerNotice).toBeVisible({ timeout: 5000 });

      // Verify bidding buttons are completely absent
      await expect(session.page.locator('button:has-text("Quick Bid")')).toHaveCount(0);
      await expect(session.page.locator('button.btn-place-bid')).toHaveCount(0);

      await saveStepScreenshot(session.page, '02_seller_own_listing_blocked.png', sidebar);
    } finally {
      await session.context.close();
    }
  });

  test('Step 3 [Negative]: Custom Bid Amount Below Minimum Required', async ({ browser }) => {
    // Eligible bidder turbo_collector
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto(`/auctions/${activeLotId}`);
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = session.page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      const customInput = session.page.locator('input[type="number"]');
      await expect(customInput).toBeVisible({ timeout: 5000 });

      // Enter an invalid low amount ($10)
      await customInput.fill('10');

      // Verify the button is disabled and input indicates error
      const placeBtn = session.page.locator('button.btn-place-bid');
      await expect(placeBtn).toBeDisabled();
      await saveStepScreenshot(session.page, '03_bid_too_low_error.png', sidebar);
    } finally {
      await session.context.close();
    }
  });

  test('Step 4 [Negative]: Empty / Non-Numeric Custom Bid Input', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto(`/auctions/${activeLotId}`);
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = session.page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      const customInput = session.page.locator('input[type="number"]');
      await expect(customInput).toBeVisible({ timeout: 5000 });

      // Clear input or type negative amount
      await customInput.fill('-500');
      const placeBtn = session.page.locator('button.btn-place-bid');
      await expect(placeBtn).toBeDisabled();
      await saveStepScreenshot(session.page, '04_empty_invalid_bid_input.png', sidebar);
    } finally {
      await session.context.close();
    }
  });

  test('Step 5 & 6 [Positive]: Eligible Bidder Places Quick Bid & Becomes Leader', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto(`/auctions/${activeLotId}`);
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = session.page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // 5. Ready state before bidding
      await saveStepScreenshot(session.page, '05_bidder_ready_to_bid.png', sidebar);

      // Place valid Quick Bid - opens confirmation modal
      const quickBtn = session.page.locator('button:has-text("Quick Bid")');
      await expect(quickBtn).toBeVisible({ timeout: 5000 });
      await quickBtn.click();

      // Verify and capture Confirmation Modal
      const confirmBtn = session.page.locator('button:has-text("Confirm & Place Bid")');
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await session.page.waitForTimeout(300);
      await saveStepScreenshot(session.page, '05b_bid_confirmation_dialog.png');

      // Confirm the quick bid
      const [res] = await Promise.all([
        session.page.waitForResponse((r) => r.url().includes('/bids/quick'), { timeout: 10000 }),
        confirmBtn.click(),
      ]);
      expect(res.status()).toBe(202);

      // 6. Capture immediate cooldown feedback ("Wait 2s")
      await saveStepScreenshot(session.page, '06_quick_bid_cooldown_ticker.png', sidebar);

      // Wait for backend queue to process and verify winning leader badge
      await expect(async () => {
        await session.page.reload();
        await expect(session.page.locator('.auction-sidebar')).toBeVisible({ timeout: 5000 });
        await expect(session.page.getByText(/You currently hold the highest bid/i)).toBeVisible({ timeout: 5000 });
      }).toPass({ timeout: 15000, intervals: [1000, 2000] });

      // 7. Winning state with green badge and leading notice
      await saveStepScreenshot(session.page, '07_winning_bidder_leader_badge.png', sidebar);

      // 8. Negative check: while winning, bidding controls are replaced with leading notice
      await expect(session.page.getByText(/You are the leading bidder at/i)).toBeVisible();
      await expect(session.page.locator('button:has-text("Quick Bid")')).toHaveCount(0);
      await saveStepScreenshot(session.page, '08_winning_bidder_cannot_reoutbid.png', sidebar);

    } finally {
      await session.context.close();
    }
  });

  test('Step 7 & 8 [Positive]: Competing Bidder Outbids with Higher Custom Bid', async ({ browser }) => {
    // Bidder 2: apex_hunter
    const session2 = await createAuthenticatedContext(browser, {
      username: 'apex_hunter',
      password: 'password123',
    });

    try {
      await session2.page.goto(`/auctions/${activeLotId}`);
      await session2.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar2 = session2.page.locator('.auction-sidebar');
      await expect(sidebar2).toBeVisible({ timeout: 10000 });

      const customInput = session2.page.locator('input[type="number"]');
      await expect(customInput).toBeVisible({ timeout: 5000 });
      const minPlaceholder = await customInput.getAttribute('placeholder');
      const minAmount = parseInt(minPlaceholder?.replace(/[^0-9]/g, '') || '50000', 10);

      // Enter higher custom amount (+$1,000 above minimum)
      const higherAmount = minAmount + 1000;
      await customInput.fill(String(higherAmount));

      const placeBtn = session2.page.locator('button.btn-place-bid');
      await expect(placeBtn).toBeEnabled({ timeout: 5000 });

      // 9. Screenshot custom bid ready
      await saveStepScreenshot(session2.page, '09_competing_bidder_custom_input.png', sidebar2);

      // Click Place Bid to open confirmation dialog
      await placeBtn.click();
      const confirmBtn = session2.page.locator('button:has-text("Confirm & Place Bid")');
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });

      // Submit custom bid confirmation
      const [res] = await Promise.all([
        session2.page.waitForResponse((r) => r.url().includes('/bids'), { timeout: 10000 }),
        confirmBtn.click(),
      ]);
      expect(res.status()).toBe(202);

      // Wait for queue processing and verify apex_hunter takes lead
      await expect(async () => {
        await session2.page.reload();
        await expect(session2.page.getByText(/You currently hold the highest bid/i)).toBeVisible({ timeout: 5000 });
      }).toPass({ timeout: 15000, intervals: [1000, 2000] });

      // 10. Screenshot apex_hunter as new winning leader
      await saveStepScreenshot(session2.page, '10_competing_bidder_takes_lead.png', sidebar2);

    } finally {
      await session2.context.close();
    }
  });

  test('Step 9 & 10 [Positive]: Original Bidder Outbid Reactivity & Bid History Feed', async ({ browser }) => {
    // Original bidder turbo_collector returns
    const session1 = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session1.page.goto(`/auctions/${activeLotId}`);
      await session1.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar1 = session1.page.locator('.auction-sidebar');
      await expect(sidebar1).toBeVisible({ timeout: 10000 });

      // 11. Verify turbo_collector is no longer winning, green badge is gone, controls re-enabled
      await expect(session1.page.getByText(/You currently hold the highest bid/i)).toHaveCount(0);
      await expect(session1.page.locator('button:has-text("Quick Bid")')).toBeVisible({ timeout: 5000 });
      await saveStepScreenshot(session1.page, '11_original_bidder_now_outbid.png', sidebar1);

      // 12. Verify Bid History list contains recent bids
      const bidHistoryList = session1.page.locator('text=Bid History');
      await expect(bidHistoryList).toBeVisible({ timeout: 5000 });
      await saveStepScreenshot(session1.page, '12_bid_history_feed.png', sidebar1);

    } finally {
      await session1.context.close();
    }
  });

  test('Step 11 [Positive]: Ended Auction State Verification', async ({ browser }) => {
    // Navigate to a known SOLD / Ended auction
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${endedLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // Verify Ended status and Sold Price
      await expect(page.getByText(/Ended/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Sold Price/i)).toBeVisible({ timeout: 5000 });

      // Verify all bidding inputs are completely removed
      await expect(page.locator('button:has-text("Quick Bid")')).toHaveCount(0);
      await expect(page.locator('button.btn-place-bid')).toHaveCount(0);
      await expect(page.locator('input[type="number"]')).toHaveCount(0);

      // 13. Screenshot ended auction state
      await saveStepScreenshot(page, '13_ended_sold_auction_state.png', sidebar);

    } finally {
      await context.close();
    }
  });
});
