import { test, expect, Browser } from '@playwright/test';

// Real database users available in the system
const DB_USERS = [
  { id: 4, username: 'apex_hunter', password: 'password123' },
  { id: 5, username: 'turbo_collector', password: 'password123' },
  { id: 6, username: 'miami_gtr', password: 'password123' },
  { id: 8, username: 'trackday_pro', password: 'password123' },
  { id: 7, username: 'bimmer_enthusiast', password: 'password123' },
  { id: 9, username: 'vintage_v8', password: 'password123' },
];

/**
 * Creates an isolated browser context and authenticates the user via the API,
 * storing the JWT in localStorage so HttpClient automatically sends Bearer tokens.
 */
async function createAuthenticatedContext(browser: Browser, user: { id: number; username: string; password: string }) {
  const context = await browser.newContext();

  // Call the login API endpoint to get a valid token
  const loginRes = await context.request.post('http://localhost:8080/api/v1/auth/login', {
    data: {
      username: user.username,
      password: user.password,
    },
  });

  if (loginRes.ok()) {
    const data = await loginRes.json();
    const token = data.token;

    // Set token in localStorage for HttpClient
    await context.addInitScript((authToken) => {
      localStorage.setItem('auth_token', authToken);
    }, token);
  }

  const page = await context.newPage();
  return { context, page, user };
}

async function fetchAuctionDetails(request: any, auctionId: string) {
  try {
    const res = await request.get(`http://localhost:8080/api/v1/auctions/${auctionId}`);
    if (res.ok()) {
      return await res.json();
    }
  } catch (_) {}
  return null;
}

test.describe('Parallel UI Bidding Simulation on One Lot', () => {
  // Ensure tests run serially to avoid race conditions on the same auction lot
  test.describe.configure({ mode: 'serial' });

  let targetLotId: string;
  let lotTitle: string;

  test.beforeAll(async ({ request }) => {
    // 1. Check if a specific lot was provided via environment variable
    if (process.env.AUCTION_ID) {
      targetLotId = process.env.AUCTION_ID;
    }

    // 2. Otherwise dynamically fetch active lots from the backend
    try {
      const res = await request.get('http://localhost:8080/api/v1/auctions?status=ACTIVE&page=0&size=10');
      if (res.ok()) {
        const body = await res.json();
        const auctions = body.content || [];
        if (auctions.length > 0) {
          const selected = auctions[0];
          targetLotId = selected.id;
          lotTitle = `${selected.item?.year} ${selected.item?.make} ${selected.item?.model}`;
        }
      }
    } catch (_) {}

    // Fallback if no backend auction found
    if (!targetLotId) {
      targetLotId = 'f060e9a5-5176-4978-aac4-ef4bbe5cc955';
      lotTitle = 'Porsche 911';
    }

    console.log(`🎯 Target Lot for Parallel UI Bidding: ${targetLotId} (${lotTitle || 'Car Lot'})`);
  });

  test('Simulate parallel bidding from several browsers and users for one lot', async ({ browser, request }) => {
    // Fetch latest lot info to identify seller and current winner
    const auction = await fetchAuctionDetails(request, targetLotId);
    const sellerId = auction?.item?.seller?.id;
    const currentWinnerId = auction?.winnerId;

    // Select 4 users who are neither the seller nor the current winner
    const eligibleUsers = DB_USERS.filter((u) => u.id !== sellerId && u.id !== currentWinnerId).slice(0, 4);
    expect(eligibleUsers.length).toBeGreaterThanOrEqual(3);

    console.log(`👥 Launching ${eligibleUsers.length} concurrent browser sessions:`, eligibleUsers.map((u) => u.username));

    // 1. Create separate browser contexts for each user
    const sessions = await Promise.all(
      eligibleUsers.map((user) => createAuthenticatedContext(browser, user))
    );

    try {
      // 2. Open the exact same lot simultaneously across all browsers
      await Promise.all(
        sessions.map(async (s) => {
          await s.page.goto(`/auctions/${targetLotId}`);
          // Dismiss cookies banner if present
          await s.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
        })
      );

      // 3. Verify all browsers successfully loaded the target lot with quick bid button
      await Promise.all(
        sessions.map(async (s) => {
          await expect(s.page.locator('text=Current Bid')).toBeVisible({ timeout: 10000 });
          const quickBtn = s.page.locator('button:has-text("Quick Bid")');
          await expect(quickBtn).toBeVisible({ timeout: 8000 });
        })
      );

      console.log(`✅ All ${sessions.length} browser windows loaded the lot.`);

      // 4. Trigger simultaneous parallel quick bids from ALL browsers at the exact same moment
      console.log(`⚡ Submitting ${sessions.length} parallel bids on lot ${targetLotId}...`);
      const bidResults = await Promise.all(
        sessions.map(async (s) => {
          const quickBtn = s.page.locator('button:has-text("Quick Bid")');
          await quickBtn.click();
          const confirmBtn = s.page.locator('button:has-text("Confirm & Place Bid")');
          await expect(confirmBtn).toBeVisible({ timeout: 5000 });
          const [res] = await Promise.all([
            s.page.waitForResponse((r) => r.url().includes('/bids/quick'), { timeout: 10000 }),
            confirmBtn.click(),
          ]);
          return { username: s.user.username, status: res.status() };
        })
      );

      // Verify that every browser session's bid was accepted into the Redis queue (HTTP 202)
      bidResults.forEach((res) => {
        console.log(`   - Browser [${res.username}]: HTTP ${res.status}`);
        expect(res.status).toBe(202);
      });

      // 5. Poll and verify that the backend queue processor processed the bids and one user leads
      await expect(async () => {
        await Promise.all(
          sessions.map(async (s) => {
            await s.page.reload();
            await expect(s.page.locator('text=Current Bid')).toBeVisible({ timeout: 5000 });
          })
        );

        const leaderStatuses = await Promise.all(
          sessions.map(async (s) => {
            const isLeading = await s.page.getByText(/You currently hold the highest bid|leading bidder/i).first().isVisible();
            return { username: s.user.username, isLeading };
          })
        );

        const leader = leaderStatuses.find((l) => l.isLeading);
        expect(leader).toBeDefined();
        console.log(`🏆 Active Leader after parallel round:`, leader?.username);
      }).toPass({ timeout: 15000, intervals: [1000, 2000] });

      // 6. Verify the Bid History list displays recent bids
      const firstPage = sessions[0].page;
      await expect(firstPage.locator('text=Bid History')).toBeVisible({ timeout: 5000 });

      // Visual pause for headed mode observation
      await sessions[0].page.waitForTimeout(2000);

    } finally {
      // Clean up all browser contexts
      await Promise.all(sessions.map((s) => s.context.close()));
    }
  });

  test('Simulate multi-round parallel bidding battle on the same lot', async ({ browser, request }) => {
    // Fetch latest lot info to identify seller and current winner
    const auction = await fetchAuctionDetails(request, targetLotId);
    const sellerId = auction?.item?.seller?.id;
    const currentWinnerId = auction?.winnerId;

    // Select 3 competing users who are neither seller nor current winner
    const competingUsers = DB_USERS.filter((u) => u.id !== sellerId && u.id !== currentWinnerId).slice(0, 3);
    expect(competingUsers.length).toBeGreaterThanOrEqual(2);

    console.log(`👥 Launching ${competingUsers.length} competing browser sessions:`, competingUsers.map((u) => u.username));

    const sessions = await Promise.all(
      competingUsers.map((user) => createAuthenticatedContext(browser, user))
    );

    try {
      // 1. All browsers navigate to the lot
      await Promise.all(
        sessions.map(async (s) => {
          await s.page.goto(`/auctions/${targetLotId}`);
          await s.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
          await expect(s.page.locator('text=Current Bid')).toBeVisible({ timeout: 10000 });
        })
      );

      // 2. Round 1: All users submit parallel quick bids
      console.log(`⚡ Round 1: Submitting parallel quick bids...`);
      const round1Results = await Promise.all(
        sessions.map(async (s) => {
          const quickBtn = s.page.locator('button:has-text("Quick Bid")');
          await quickBtn.click();
          const confirmBtn = s.page.locator('button:has-text("Confirm & Place Bid")');
          await expect(confirmBtn).toBeVisible({ timeout: 5000 });
          const [res] = await Promise.all([
            s.page.waitForResponse((r) => r.url().includes('/bids/quick'), { timeout: 10000 }),
            confirmBtn.click(),
          ]);
          return { username: s.user.username, status: res.status() };
        })
      );

      round1Results.forEach((res) => expect(res.status).toBe(202));

      // Wait for batch processing and identify the outbid user
      let outbidSession: (typeof sessions)[0] | null = null;
      await expect(async () => {
        await Promise.all(
          sessions.map(async (s) => {
            await s.page.reload();
            await expect(s.page.locator('text=Current Bid')).toBeVisible({ timeout: 5000 });
          })
        );

        const leaderStatuses = await Promise.all(
          sessions.map(async (s) => {
            const isLeading = await s.page.getByText(/You currently hold the highest bid|leading bidder/i).first().isVisible();
            return { s, isLeading };
          })
        );

        const leader = leaderStatuses.find((l) => l.isLeading);
        const nonLeader = leaderStatuses.find((l) => !l.isLeading);
        expect(leader).toBeDefined();
        expect(nonLeader).toBeDefined();
        outbidSession = nonLeader!.s;
        console.log(`👑 Round 1 Winner: [${leader!.s.user.username}], Outbid: [${nonLeader!.s.user.username}]`);
      }).toPass({ timeout: 15000, intervals: [1000, 2000] });

      // 3. Round 2: The outbid user battles back with a higher custom bid on the same lot
      if (outbidSession) {
        const activeOutbid: (typeof sessions)[0] = outbidSession;
        console.log(`⚔️ Round 2: User [${activeOutbid.user.username}] placing escalating custom bid...`);
        const customInput = activeOutbid.page.locator('input[type="number"]');
        await expect(customInput).toBeVisible({ timeout: 8000 });
        const minPlaceholder = await customInput.getAttribute('placeholder');
        const minAmount = parseInt(minPlaceholder?.replace(/[^0-9]/g, '') || '50000', 10);
        const nextAmount = minAmount + 500;
        await customInput.fill(String(nextAmount));

        const placeBtn = activeOutbid.page.locator('button.btn-place-bid');
        await expect(placeBtn).toBeEnabled({ timeout: 5000 });
        await placeBtn.click();

        const confirmBtn = activeOutbid.page.locator('button:has-text("Confirm & Place Bid")');
        await expect(confirmBtn).toBeVisible({ timeout: 5000 });

        const [res] = await Promise.all([
          activeOutbid.page.waitForResponse((r) => r.url().includes('/bids'), { timeout: 10000 }),
          confirmBtn.click(),
        ]);
        expect(res.status()).toBe(202);
        console.log(`   - Custom Bid submitted ($${nextAmount}), HTTP 202 accepted`);

        // After placing custom bid, poll until this user takes the lead
        await expect(async () => {
          await activeOutbid.page.reload();
          await expect(
            activeOutbid.page.getByText(/You currently hold the highest bid|leading bidder/i).first()
          ).toBeVisible({ timeout: 5000 });
        }).toPass({ timeout: 15000, intervals: [1000, 2000] });

        console.log(`🏆 User [${activeOutbid.user.username}] successfully counter-bid and took the lead!`);
        // Visual pause for headed mode observation
        await activeOutbid.page.waitForTimeout(2000);
      }

    } finally {
      await Promise.all(sessions.map((s) => s.context.close()));
    }
  });
});
