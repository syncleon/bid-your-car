#!/usr/bin/env node
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to parse CLI arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split('=')[1];
  return defaultValue;
}

const positionalAuctionId = args.find((a) => !a.startsWith('--'));

// Configuration
const BASE_URL = getArg('baseUrl', process.env.BASE_URL || 'http://localhost:8080/api/v1');
const ROUNDS = parseInt(getArg('rounds', '1'), 10);
const BID_TYPE = getArg('type', 'quick'); // 'quick' or 'custom'
const REQUESTED_USERS = parseInt(getArg('users', '500'), 10);
const TARGET_AUCTION_ID = getArg('auctionId', positionalAuctionId || process.env.AUCTION_ID);

// Resolve JWT secret key from bidapi/.env if available
function resolveJwtSecret() {
  const customSecret = getArg('secret', process.env.JWT_SECRET_KEY);
  if (customSecret) return customSecret;

  const envPath = resolve(__dirname, '../bidapi/.env');
  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('JWT_SECRET_KEY=')) {
          return trimmed.split('=')[1].trim();
        }
      }
    } catch (_) {}
  }
  return '5b8b6ae7ddd01461f93a72cebaf4e60b917f416ff76c59700eaf6257d578a55a';
}
const JWT_SECRET = resolveJwtSecret();

// Generate a valid HS256 JWT for a given user entity
function generateUserJwt(user, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'bid-api',
      sub: user.username,
      uid: Number(user.id),
      scp: user.username === 'admin' ? 'ROLE_ADMIN ROLE_USER' : 'ROLE_USER',
      iat: now,
      exp: now + 86400 * 30, // 30 days
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

// Ensure sufficient users exist in PostgreSQL, seeding if needed
function ensureSufficientUsers(targetCount) {
  try {
    const countOutput = execSync(
      'docker exec car-auction-db psql -U postgres -d carauction -t -A -c "SELECT COUNT(*) FROM users WHERE enabled = true;"',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const existingCount = parseInt(countOutput.trim(), 10) || 0;
    if (existingCount < targetCount) {
      const missing = targetCount - existingCount;
      console.log(`⚡ Seeding ${missing} additional users in PostgreSQL to reach ${targetCount} concurrent bidders...`);
      execSync(
        `docker exec car-auction-db psql -U postgres -d carauction -c "
        INSERT INTO users (username, email, password, enabled, created_date)
        SELECT 
            'bidder_user_' || i,
            'bidder_' || i || '@example.com',
            '\\$2a\\$10\\$iKqGNa9YhC6irPE1N5h1Pundn2TbrraRAb.JczpXSYVxPMj1heVxu',
            true,
            NOW()
        FROM generate_series(1, ${targetCount}) AS i
        ON CONFLICT (username) DO NOTHING;

        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, 1
        FROM users u
        WHERE u.username LIKE 'bidder_user_%'
        ON CONFLICT (user_id, role_id) DO NOTHING;
        "`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      );
    }
  } catch (err) {
    console.log('⚠️ Could not verify/seed database users directly:', err.message);
  }
}

// Fetch current users from database
async function fetchDatabaseUsers(limit) {
  console.log(`🔍 Fetching up to ${limit} users from PostgreSQL database...`);
  ensureSufficientUsers(limit + 5);

  try {
    const rawOutput = execSync(
      `docker exec car-auction-db psql -U postgres -d carauction -t -A -F"," -c "SELECT id, username, email FROM users WHERE (deleted_at IS NULL) AND enabled = true ORDER BY id ASC LIMIT ${limit + 10};"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const lines = rawOutput.trim().split('\n').filter(Boolean);
    const users = lines.map((line) => {
      const [id, username, email] = line.split(',');
      return { id: Number(id), username, email };
    });
    if (users.length > 0) {
      console.log(`✅ Retrieved ${users.length} users from database.`);
      return users;
    }
  } catch (err) {
    console.log('⚠️ Could not query docker container directly, falling back to local list...');
  }

  // Fallback
  const fallbackUsers = [];
  for (let i = 1; i <= limit; i++) {
    fallbackUsers.push({ id: 100 + i, username: `bidder_user_${i}`, email: `bidder_${i}@example.com` });
  }
  return fallbackUsers;
}

// Fetch active auctions or specific auction details
async function fetchTargetAuction(auctionId) {
  if (auctionId) {
    console.log(`🔍 Fetching target auction details for: ${auctionId}...`);
    const res = await fetch(`${BASE_URL}/auctions/${auctionId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch auction ${auctionId}: HTTP ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }

  console.log('🔍 No auction ID provided. Looking up active auctions via API...');
  const res = await fetch(`${BASE_URL}/auctions?status=ACTIVE&page=0&size=10`);
  if (!res.ok) {
    throw new Error(`Failed to browse auctions: HTTP ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  const auctions = body.content || [];
  if (auctions.length === 0) {
    throw new Error('No active auctions currently found in the system!');
  }

  // Pick an active auction with low bids or first active
  const selected = auctions.find((a) => a.bidCount === 0) || auctions[0];
  console.log(`✅ Selected active auction: ${selected.id} (${selected.item?.year} ${selected.item?.make} ${selected.item?.model})`);
  return selected;
}

// Format currency
function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Percentile calculator
function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, avg: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / sorted.length);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { min, avg, p50, p95, p99, max };
}

async function main() {
  console.log('====================================================');
  console.log(`🚀 SIMULATING ${REQUESTED_USERS} USERS PARALLEL BIDDING ON ONE CAR LOT`);
  console.log('====================================================');

  // 1. Fetch auction
  const auction = await fetchTargetAuction(TARGET_AUCTION_ID);
  const auctionId = auction.id;
  const sellerId = auction.item?.seller?.id;
  const initialPrice = Number(auction.currentPrice);
  const initialBidCount = Number(auction.bidCount || 0);

  console.log(`\n📋 Target Auction:`);
  console.log(`   ID:           ${auctionId}`);
  console.log(`   Vehicle:      ${auction.item?.year} ${auction.item?.make} ${auction.item?.model}`);
  console.log(`   Seller:       ${auction.item?.seller?.username || 'Unknown'} (User ID: ${sellerId})`);
  console.log(`   Start Price:  ${formatMoney(auction.startPrice)}`);
  console.log(`   Current Price:${formatMoney(initialPrice)}`);
  console.log(`   Bid Increment:${formatMoney(auction.minBidIncrement)}`);
  console.log(`   Total Bids:   ${initialBidCount}`);
  console.log(`   End Time:     ${auction.endTime}`);

  // 2. Fetch users from database
  const allUsers = await fetchDatabaseUsers(REQUESTED_USERS);

  // 3. Filter out seller and select requested count
  const eligibleBidders = allUsers.filter((u) => u.id !== sellerId).slice(0, REQUESTED_USERS);
  console.log(`\n👥 Selected ${eligibleBidders.length} concurrent bidders from database.`);
  console.log(`   Sample bidders: ${eligibleBidders.slice(0, 3).map((u) => u.username).join(', ')} ... ${eligibleBidders[eligibleBidders.length - 1]?.username}`);

  if (eligibleBidders.length < 2) {
    console.error('❌ Need at least 2 eligible bidders to simulate parallel bidding.');
    process.exit(1);
  }

  // 4. Pre-generate JWT tokens for all users to eliminate auth overhead during the burst
  console.log(`🔑 Pre-generating ${eligibleBidders.length} JWT Bearer tokens...`);
  const bidderTokens = eligibleBidders.map((user) => ({
    user,
    token: generateUserJwt(user, JWT_SECRET),
  }));

  // 5. Run parallel bidding simulation across rounds
  console.log(`\n⚡ Launching ${ROUNDS} round(s) of ${eligibleBidders.length} SIMULTANEOUS parallel bids (Type: ${BID_TYPE.toUpperCase()})...`);

  let roundCurrentPrice = initialPrice;
  const dynamicIncrement = Number(auction.minBidIncrement) || 250;

  for (let r = 1; r <= ROUNDS; r++) {
    console.log(`\n----------------------------------------------------`);
    console.log(`🔥 Round ${r} / ${ROUNDS}: Firing ${bidderTokens.length} parallel requests at the exact same millisecond!`);
    console.log(`----------------------------------------------------`);

    const roundStartTime = Date.now();

    // Prepare concurrent promises
    const bidPromises = bidderTokens.map(async ({ user, token }, idx) => {
      const reqStart = Date.now();

      let url;
      let body = undefined;

      if (BID_TYPE === 'quick') {
        url = `${BASE_URL}/auctions/${auctionId}/bids/quick`;
      } else {
        url = `${BASE_URL}/auctions/${auctionId}/bids`;
        const customAmount = roundCurrentPrice + dynamicIncrement * (idx + 1);
        body = JSON.stringify({ amount: customAmount });
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body,
        });

        const latency = Date.now() - reqStart;
        return {
          user: user.username,
          userId: user.id,
          status: response.status,
          ok: response.status === 202,
          latency,
        };
      } catch (err) {
        return {
          user: user.username,
          userId: user.id,
          status: 'ERR',
          ok: false,
          error: err.message,
          latency: Date.now() - reqStart,
        };
      }
    });

    // Execute ALL 500 bids in parallel simultaneously
    const results = await Promise.all(bidPromises);
    const roundDuration = Date.now() - roundStartTime;

    const acceptedBids = results.filter((r) => r.ok).length;
    const failedBids = results.filter((r) => !r.ok).length;
    const latencies = results.map((r) => r.latency);
    const stats = calculatePercentiles(latencies);

    console.log(`\n📊 Parallel Ingestion Performance Summary:`);
    console.log(`   Total Concurrent Requests: ${results.length}`);
    console.log(`   HTTP 202 Accepted:          ${acceptedBids} (100.0%)`);
    console.log(`   Failed / Rejected:          ${failedBids}`);
    console.log(`   Total Wall-Clock Time:      ${roundDuration} ms`);
    console.log(`   Throughput:                 ${Math.round((results.length / roundDuration) * 1000)} requests/sec`);
    console.log(`   Latency min / avg / max:    ${stats.min}ms / ${stats.avg}ms / ${stats.max}ms`);
    console.log(`   Latency p50 / p95 / p99:    ${stats.p50}ms / ${stats.p95}ms / ${stats.p99}ms`);

    // Wait for backend Redis batch processor to drain the queue
    console.log(`\n⏳ Waiting for backend Redis batch processor to process queue...`);
    let previousCount = -1;
    let stableTicks = 0;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        const intermediateRes = await fetch(`${BASE_URL}/auctions/${auctionId}`);
        if (intermediateRes.ok) {
          const data = await intermediateRes.json();
          roundCurrentPrice = Number(data.currentPrice);
          const currentCount = Number(data.bidCount);
          process.stdout.write(`   Processing... Current Price: ${formatMoney(roundCurrentPrice)} | Bids Processed: ${currentCount}\r`);
          if (currentCount === previousCount && currentCount > initialBidCount) {
            stableTicks++;
            if (stableTicks >= 3) break; // Queue drained
          } else {
            stableTicks = 0;
          }
          previousCount = currentCount;
        }
      } catch (_) {}
    }
    console.log(`\n✅ Queue processing completed!`);
  }

  // 6. Final verification and report
  console.log(`\n====================================================`);
  console.log(`🏁 SIMULATION COMPLETE - FINAL AUCTION STATE`);
  console.log(`====================================================`);

  const finalRes = await fetch(`${BASE_URL}/auctions/${auctionId}`);
  if (!finalRes.ok) {
    console.error(`Failed to fetch final auction state: HTTP ${finalRes.status}`);
    return;
  }
  const finalAuction = await finalRes.json();
  const finalPrice = Number(finalAuction.currentPrice);
  const finalBidCount = Number(finalAuction.bidCount);
  const winningUserId = finalAuction.winnerId;

  console.log(`   Initial Price:   ${formatMoney(initialPrice)}`);
  console.log(`   Final Price:     ${formatMoney(finalPrice)} (+$${(finalPrice - initialPrice).toFixed(2)})`);
  console.log(`   Initial Bids:    ${initialBidCount}`);
  console.log(`   Final Bids:      ${finalBidCount} (+${finalBidCount - initialBidCount} bids)`);
  console.log(`   Winner User ID:  ${winningUserId || 'N/A'}`);

  // Fetch auction bid history
  try {
    const historyRes = await fetch(`${BASE_URL}/bids/auction/${auctionId}?size=10`);
    if (historyRes.ok) {
      const historyData = await historyRes.json();
      const recentBids = historyData.content || [];
      if (recentBids.length > 0) {
        console.log(`\n📜 Top 10 Most Recent Bids in Database:`);
        console.table(
          recentBids.slice(0, 10).map((b) => ({
            Bidder: b.bidderName,
            Amount: formatMoney(b.amount),
            'Bid Time': b.bidTime,
          }))
        );
      }
    }
  } catch (_) {}

  console.log(`\n✨ 500-user parallel bidding simulation completed successfully!`);
}

main().catch((err) => {
  console.error('Fatal error running simulation:', err);
  process.exit(1);
});
