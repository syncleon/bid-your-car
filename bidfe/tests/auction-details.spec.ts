import { test, expect } from '@playwright/test';

const mockAuction = {
  id: 'auction-1',
  item: {
    id: 'item-1',
    make: 'Porsche',
    model: '911 GT3',
    year: 2024,
    mileage: 500,
    location: 'Los Angeles, CA',
    description: 'Pristine.',
    seller: { id: 2, username: 'sellerUser' },
    images: []
  },
  status: 'ACTIVE',
  startPrice: 150000,
  currentPrice: 155000,
  minBidIncrement: 1000,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 86400000).toISOString(),
  bidCount: 5
};

test.describe('Auction Details & Bidding', () => {

  test('allows an authenticated user to place a quick bid', async ({ page }) => {
    // 1. Mock logged in user (id: 1, which is NOT the seller id: 2)
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ json: { id: 1, username: "bidderUser", roles: [{name: "USER"}] } });
    });

    // 2. Mock auction details
    await page.route('**/api/v1/auctions/auction-1', async route => {
      await route.fulfill({ json: mockAuction });
    });

    // 3. Mock bid history (empty or some bids)
    await page.route('**/api/v1/bids/auction/auction-1*', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0 } });
    });

    // 4. Mock quick bid submission
    await page.route('**/api/v1/auctions/auction-1/bids/quick', async route => {
      await route.fulfill({ 
        json: { id: 'bid-1', amount: 156000, timestamp: new Date().toISOString() } 
      });
    });

    // Navigate to the auction details page
    await page.goto('/auctions/auction-1');

    // Verify auction details rendered
    await expect(page.locator('h1', { hasText: '2024 Porsche 911 GT3' })).toBeVisible();
    await expect(page.locator('text=Current Bid')).toBeVisible();
    await expect(page.locator('text=$155,000')).toBeVisible();

    // Verify Quick Bid button is visible (since user is not seller)
    const quickBidBtn = page.locator('button', { hasText: 'Quick Bid' });
    await expect(quickBidBtn).toBeVisible();

    // Setup an alert handler to catch the JS alert or handle toast if it exists
    // The BiddingCard handles successful bid natively without alert, and enters a cooldown.
    
    // Click Quick Bid
    await quickBidBtn.click();
    
    // Wait for the cooldown state to indicate successful bid submission
    await expect(page.locator('text=/Wait \\ds/').first()).toBeVisible();
  });

  test('shows owner controls when user is the seller', async ({ page }) => {
    // 1. Mock logged in user (id: 2, WHICH IS the seller id)
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ json: { id: 2, username: "sellerUser", roles: [{name: "USER"}] } });
    });

    // 2. Mock auction details
    await page.route('**/api/v1/auctions/auction-1', async route => {
      await route.fulfill({ json: mockAuction });
    });

    await page.route('**/api/v1/bids/auction/auction-1*', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0 } });
    });

    // Navigate to the auction details page
    await page.goto('/auctions/auction-1');

    // Verify auction details rendered
    await expect(page.locator('h1', { hasText: '2024 Porsche 911 GT3' })).toBeVisible();

    // Verify Owner panel is visible
    await expect(page.locator('h4', { hasText: 'Owner Actions' })).toBeVisible();
    
    // Verify Cancel button is visible
    const cancelBtn = page.locator('button', { hasText: 'Cancel Auction' });
    await expect(cancelBtn).toBeVisible();

    // Bidding controls should NOT be visible for the owner
    await expect(page.locator('button', { hasText: 'Quick Bid' })).not.toBeVisible();
  });
});
