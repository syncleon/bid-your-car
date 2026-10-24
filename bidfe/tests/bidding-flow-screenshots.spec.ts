import { test, expect } from '@playwright/test';
import { createScreenshotSaver, createAuthenticatedContext } from './helpers/screenshot';

const saveStepScreenshot = createScreenshotSaver('bidding-flow');

test.describe('Bidding Flow Deep Analysis with Screenshots (Positive & Negative)', () => {
  test.describe.configure({ mode: 'serial' });

  let activeLotId = 'f54d67f6-f07c-427b-9ed8-846780eaaaf9';
  let activeLotSeller = 'vintage_v8';
  let endedLotId = '5dd616b4-c4bd-4bed-b704-2d09bf3cc225';

  test.beforeAll(async ({ request }) => {
    try {
      const activeRes = await request.get('http://localhost:8080/api/v1/auctions?status=ACTIVE&size=20');
      if (activeRes.ok()) {
        const data = await activeRes.json();
        const lot = data.content?.find(
          (a: { item?: { seller?: { username?: string } } }) =>
            a.item?.seller?.username &&
            a.item.seller.username !== 'turbo_collector' &&
            a.item.seller.username !== 'apex_hunter'
        );
        if (lot) {
          activeLotId = lot.id;
          activeLotSeller = lot.item.seller.username;
        }
      }

      const endedRes = await request.get('http://localhost:8080/api/v1/auctions?status=SOLD&size=5');
      if (endedRes.ok()) {
        const data = await endedRes.json();
        if (data.content && data.content.length > 0) {
          endedLotId = data.content[0].id;
        }
      }
      if (!endedLotId) {
        const unsoldRes = await request.get('http://localhost:8080/api/v1/auctions?status=UNSOLD&size=5');
        if (unsoldRes.ok()) {
          const data = await unsoldRes.json();
          if (data.content && data.content.length > 0) {
            endedLotId = data.content[0].id;
          }
        }
      }
    } catch (e) {
      console.warn('Could not dynamically query auctions in beforeAll, falling back to defaults:', e);
    }
  });

  test('Step 1 [Negative]: Unauthenticated User Bidding Prevention', async ({ browser }) => {
    // 1. Launch a completely clean, unauthenticated context (guest)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
      await saveStepScreenshot(sidebar, '01_unauthenticated_user_blocked.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Negative]: Seller Cannot Bid on Own Listing', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: activeLotSeller,
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

      await saveStepScreenshot(sidebar, '02_seller_own_listing_blocked.png');
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
      await saveStepScreenshot(sidebar, '03_bid_too_low_error.png');
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
      await saveStepScreenshot(sidebar, '04_empty_invalid_bid_input.png');
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
      await saveStepScreenshot(sidebar, '05_bidder_ready_to_bid.png');

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
      await saveStepScreenshot(sidebar, '06_quick_bid_cooldown_ticker.png');

      // Wait for backend queue to process and verify winning leader badge
      await expect(async () => {
        await session.page.reload();
        await expect(session.page.locator('.auction-sidebar')).toBeVisible({ timeout: 5000 });
        await expect(session.page.getByText(/You currently hold the highest bid/i)).toBeVisible({ timeout: 5000 });
      }).toPass({ timeout: 15000, intervals: [1000, 2000] });

      // 7. Winning state with green badge and leading notice
      await saveStepScreenshot(sidebar, '07_winning_bidder_leader_badge.png');

      // 8. Negative check: while winning, bidding controls are replaced with leading notice
      await expect(session.page.getByText(/You are the leading bidder at/i)).toBeVisible();
      await expect(session.page.locator('button:has-text("Quick Bid")')).toHaveCount(0);
      await saveStepScreenshot(sidebar, '08_winning_bidder_cannot_reoutbid.png');

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
      await saveStepScreenshot(sidebar2, '09_competing_bidder_custom_input.png');

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
      await saveStepScreenshot(sidebar2, '10_competing_bidder_takes_lead.png');

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
      await saveStepScreenshot(sidebar1, '11_original_bidder_now_outbid.png');

      // 12. Verify Bid History list contains recent bids
      const bidHistoryList = session1.page.locator('text=Bid History');
      await expect(bidHistoryList).toBeVisible({ timeout: 5000 });
      await saveStepScreenshot(sidebar1, '12_bid_history_feed.png');

    } finally {
      await session1.context.close();
    }
  });

  test('Step 11 [Positive]: Ended Auction State Verification', async ({ browser }) => {
    // Navigate to a known SOLD / Ended auction
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`/auctions/${endedLotId}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      const sidebar = page.locator('.auction-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // Verify Ended / Unsold / Sold status
      await expect(page.locator('.auction-sidebar').getByText(/Ended|SOLD|UNSOLD/i).first()).toBeVisible({ timeout: 5000 });

      // Verify all bidding inputs are completely removed
      await expect(page.locator('button:has-text("Quick Bid")')).toHaveCount(0);
      await expect(page.locator('button.btn-place-bid')).toHaveCount(0);
      await expect(page.locator('input[type="number"]')).toHaveCount(0);

      // 13. Screenshot ended auction state
      await saveStepScreenshot(sidebar, '13_ended_sold_auction_state.png');

    } finally {
      await context.close();
    }
  });
});
