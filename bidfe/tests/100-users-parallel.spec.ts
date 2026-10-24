import { test, expect, Browser, Page } from '@playwright/test';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/parallel-bidding';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/parallel-bidding';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(page: Page, filename: string) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await page.screenshot({ path: artifactPath });
  await page.screenshot({ path: localPath });
  console.log(`📸 Saved Parallel Test Screenshot: ${filename}`);
}

const JWT_SECRET = process.env.JWT_SECRET_KEY || '5b8b6ae7ddd01461f93a72cebaf4e60b917f416ff76c59700eaf6257d578a55a';

interface DbUser {
  id: number;
  username: string;
  email: string;
}

// Generate valid JWT token for a given user
function generateUserJwt(user: { id: number; username: string }) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'bid-api',
      sub: user.username,
      uid: Number(user.id),
      scp: user.username === 'admin' ? 'ROLE_ADMIN ROLE_USER' : 'ROLE_USER',
      iat: now,
      exp: now + 86400 * 30,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

// Fetch 100 users from PostgreSQL database
function get100DatabaseUsers(): DbUser[] {
  try {
    const rawOutput = execSync(
      'docker exec car-auction-db psql -U postgres -d carauction -t -A -F"," -c "SELECT id, username, email FROM users WHERE enabled = true AND (deleted_at IS NULL) ORDER BY id ASC LIMIT 120;"',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const lines = rawOutput.trim().split('\n').filter(Boolean);
    const users: DbUser[] = lines.map((line) => {
      const [id, username, email] = line.split(',');
      return { id: Number(id), username, email };
    });
    if (users.length >= 100) {
      return users;
    }
  } catch {
    // Fallback if docker query fails
  }

  // Fallback if docker query fails
  const fallback: DbUser[] = [];
  for (let i = 1; i <= 100; i++) {
    fallback.push({ id: 10 + i, username: `bidder_user_${i}`, email: `bidder_${i}@example.com` });
  }
  return fallback;
}

async function createAuthenticatedContext(browser: Browser, user: { id: number; username: string }, token: string) {
  const context = await browser.newContext();
  await context.addInitScript((authToken) => {
    localStorage.setItem('auth_token', authToken);
  }, token);
  const page = await context.newPage();
  return { context, page, user, token };
}

test.describe('100 Users Parallel Bidding Test Suite', () => {
  test.describe.configure({ mode: 'serial' });

  let targetLotId: string;
  let lotTitle: string;
  let sellerId: number;

  test.beforeAll(async ({ request }) => {
    // 1. Resolve an active lot
    if (process.env.AUCTION_ID) {
      targetLotId = process.env.AUCTION_ID;
    } else {
      try {
        const res = await request.get('http://localhost:8080/api/v1/auctions?status=ACTIVE&page=0&size=10');
        if (res.ok()) {
          const body = await res.json();
          const auctions = body.content || [];
          if (auctions.length > 0) {
            // Prefer an auction with fewer bids to clearly see the 100 bids jump
            const selected = auctions.find((a: { bidCount?: number }) => a.bidCount === 0) || auctions[0];
            targetLotId = selected.id;
            sellerId = selected.item?.seller?.id || 1;
            lotTitle = `${selected.item?.year} ${selected.item?.make} ${selected.item?.model}`;
          }
        }
      } catch {
        // Fallback if request fails
      }
    }

    if (!targetLotId) {
      targetLotId = '8492d14a-25b8-4b9f-be5d-8867c3d5b193';
      lotTitle = 'Audi R8';
    }

    console.log(`🎯 Target Lot for 100-User Parallel Test: ${targetLotId} (${lotTitle || 'Car Lot'})`);
  });

  test('Simulate 100 users submitting parallel quick bids simultaneously', async ({ browser, request }) => {
    // 1. Prepare 100 database users (excluding the seller)
    const allUsers = get100DatabaseUsers();
    const eligibleBidders = allUsers.filter((u) => u.id !== sellerId).slice(0, 100);
    expect(eligibleBidders.length).toBe(100);

    console.log(`👥 Prepared 100 distinct database users: [${eligibleBidders[0].username} ... ${eligibleBidders[99].username}]`);

    // 2. Pre-generate JWT tokens for all 100 users
    const biddersWithTokens = eligibleBidders.map((user) => ({
      ...user,
      token: generateUserJwt(user),
    }));

    // 3. Open a live UI browser session to watch the auction update live
    const observerUser = biddersWithTokens[0];
    const observerSession = await createAuthenticatedContext(browser, observerUser, observerUser.token);

    try {
      await observerSession.page.goto(`/auctions/${targetLotId}`);
      await observerSession.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(observerSession.page.locator('text=Current Bid')).toBeVisible({ timeout: 10000 });

      // Record initial auction state before the 100-user wave
      const initialDetailsRes = await request.get(`http://localhost:8080/api/v1/auctions/${targetLotId}`);
      expect(initialDetailsRes.ok()).toBeTruthy();
      const initialDetails = await initialDetailsRes.json();
      const initialBidCount = Number(initialDetails.bidCount || 0);
      const initialPrice = Number(initialDetails.currentPrice);

      console.log(`📊 Initial State: Price = $${initialPrice.toLocaleString()}, Bids = ${initialBidCount}`);

      // 4. FIRE 100 PARALLEL BIDS AT THE EXACT SAME MILLISECOND
      console.log(`⚡ Firing 100 parallel quick bids simultaneously across 100 database users...`);
      const startTime = Date.now();

      const bidResponses = await Promise.all(
        biddersWithTokens.map(async (bidder) => {
          const res = await request.post(`http://localhost:8080/api/v1/auctions/${targetLotId}/bids/quick`, {
            headers: {
              Authorization: `Bearer ${bidder.token}`,
            },
          });
          return { username: bidder.username, status: res.status() };
        })
      );

      const totalTimeMs = Date.now() - startTime;
      console.log(`⏱️ All 100 parallel requests sent in ${totalTimeMs}ms (Throughput: ${Math.round((100 / totalTimeMs) * 1000)} req/s)`);

      // 5. Verify that EVERY single one of the 100 users received HTTP 202 Accepted
      const acceptedCount = bidResponses.filter((r) => r.status === 202).length;
      console.log(`📥 Ingestion Result: ${acceptedCount} / 100 requests accepted into Redis queue (HTTP 202)`);
      expect(acceptedCount).toBe(100);

      // 6. Verify in the live browser UI that the batch queue drained and state updated
      console.log(`⏳ Verifying batch processing and UI reflection in live browser...`);
      await expect(async () => {
        await observerSession.page.reload();
        await expect(observerSession.page.locator('text=Current Bid')).toBeVisible({ timeout: 5000 });

        const freshDetailsRes = await request.get(`http://localhost:8080/api/v1/auctions/${targetLotId}`);
        const freshDetails = await freshDetailsRes.json();
        const currentBids = Number(freshDetails.bidCount);
        const currentPrice = Number(freshDetails.currentPrice);

        // All 100 bids must be processed into the database
        expect(currentBids).toBeGreaterThanOrEqual(initialBidCount + 100);
        expect(currentPrice).toBeGreaterThan(initialPrice);
      }).toPass({ timeout: 20000, intervals: [1000, 2000] });

      // 7. Verify Bid History contains recent bids in the browser DOM
      await expect(observerSession.page.locator('text=Bid History')).toBeVisible({ timeout: 5000 });

      // Check winning bidder
      const finalAuctionRes = await request.get(`http://localhost:8080/api/v1/auctions/${targetLotId}`);
      const finalAuction = await finalAuctionRes.json();
      console.log(`🏆 Final State after 100 parallel bids:`);
      console.log(`   Price: $${Number(finalAuction.currentPrice).toLocaleString()} (+$${(Number(finalAuction.currentPrice) - initialPrice).toLocaleString()})`);
      console.log(`   Total Bids: ${finalAuction.bidCount} (+100 bids)`);
      console.log(`   Winner User ID: ${finalAuction.winnerId}`);

      expect(finalAuction.winnerId).toBeDefined();

      await saveScreenshot(observerSession.page, 'parallel_100_quick_bids_result.png');

      // Brief visual pause for headed mode
      await observerSession.page.waitForTimeout(2000);

    } finally {
      await observerSession.context.close();
    }
  });

  test('Simulate 100 users submitting parallel escalating custom bids', async ({ browser, request }) => {
    // 1. Prepare 100 database users (excluding seller)
    const allUsers = get100DatabaseUsers();
    const eligibleBidders = allUsers.filter((u) => u.id !== sellerId).slice(0, 100);
    const biddersWithTokens = eligibleBidders.map((user) => ({
      ...user,
      token: generateUserJwt(user),
    }));

    // 2. Fetch current auction price & dynamic increment
    const currentRes = await request.get(`http://localhost:8080/api/v1/auctions/${targetLotId}`);
    const currentDetails = await currentRes.json();
    const currentPrice = Number(currentDetails.currentPrice);
    const increment = Number(currentDetails.minBidIncrement || 1000);
    const stepIncrement = Math.max(increment, 1000);

    console.log(`\n⚔️ Round 2: 100 users placing escalating custom bids starting from $${currentPrice.toLocaleString()} (Step: $${stepIncrement})`);

    // 3. Open browser session for top bidder candidate (bidder #100)
    const topBidder = biddersWithTokens[99]; // bidder with highest custom amount
    const topBidderSession = await createAuthenticatedContext(browser, topBidder, topBidder.token);

    try {
      await topBidderSession.page.goto(`/auctions/${targetLotId}`);
      await topBidderSession.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(topBidderSession.page.locator('text=Current Bid')).toBeVisible({ timeout: 10000 });

      // 4. FIRE 100 PARALLEL CUSTOM ESCALATING BIDS
      // Each user bids (currentPrice + stepIncrement * (i + 1))
      const startTime = Date.now();
      const customBidResponses = await Promise.all(
        biddersWithTokens.map(async (bidder, index) => {
          const customAmount = currentPrice + stepIncrement * (index + 1);
          const res = await request.post(`http://localhost:8080/api/v1/auctions/${targetLotId}/bids`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${bidder.token}`,
            },
            data: {
              amount: customAmount,
            },
          });
          return { username: bidder.username, status: res.status(), amount: customAmount };
        })
      );

      const elapsed = Date.now() - startTime;
      console.log(`⏱️ 100 custom bids submitted in ${elapsed}ms`);

      const accepted = customBidResponses.filter((r) => r.status === 202).length;
      expect(accepted).toBe(100);

      // 5. Verify batch processing & leader update on top bidder's browser
      await expect(async () => {
        await topBidderSession.page.reload();
        await expect(topBidderSession.page.locator('text=Current Bid')).toBeVisible({ timeout: 5000 });
        
        const checkRes = await request.get(`http://localhost:8080/api/v1/auctions/${targetLotId}`);
        const checkAuction = await checkRes.json();
        expect(Number(checkAuction.currentPrice)).toBeGreaterThan(currentPrice);
        expect(Number(checkAuction.winnerId)).toBe(topBidder.id);

        await expect(
          topBidderSession.page.getByText(/You currently hold the highest bid|leading bidder/i).first()
        ).toBeVisible({ timeout: 3000 });
      }).toPass({ timeout: 25000, intervals: [1000, 2000] });

      console.log(`👑 Top Bidder [${topBidder.username}] successfully holds the highest bid in the UI!`);

      await saveScreenshot(topBidderSession.page, 'parallel_100_custom_bids_result.png');

      // Visual pause for headed mode
      await topBidderSession.page.waitForTimeout(2000);

    } finally {
      await topBidderSession.context.close();
    }
  });
});
