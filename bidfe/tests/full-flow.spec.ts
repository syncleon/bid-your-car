import { test, expect } from '@playwright/test';

test.describe('Full Creation Flow', () => {
  test('creates an item and lists it for auction', async ({ page }) => {
    // 1. Mock the authenticated user
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ 
        json: { id: 1, username: "testuser", roles: [{name: "USER"}], email: "test@example.com" } 
      });
    });

    // 2. Mock item creation
    await page.route('**/api/v1/items', async route => {
      await route.fulfill({
        status: 201,
        json: { 
          id: "item-123", make: "Porsche", model: "911 GT3", year: 2024,
          vin: "1HGCM82633A000000", location: "Los Angeles, CA", mileage: 500,
          description: "Pristine condition GT3.", condition: "EXCELLENT",
          isNoReserve: true, status: "DRAFT", isModified: false,
          hasServiceHistory: false, seller: { id: 1, username: "testuser" },
          images: [], thumbnailUrl: null, fuelType: null, horsepower: null,
          titleStatus: null, reservePrice: null, engine: null, drivetrain: null,
          transmission: null, bodyStyle: null, exteriorColor: null, interiorColor: null,
          sellerType: null, auctionId: null, auction: null
        }
      });
    });

    // 3. Mock image upload
    await page.route('**/api/v1/items/*/images', async route => {
      await route.fulfill({
        status: 201,
        json: { id: "img-1", url: "http://example.com/mock.jpg", category: "MAIN" }
      });
    });

    // 4. Mock initial item fetch (DRAFT state)
    await page.route('**/api/v1/items/item-123', async route => {
      await route.fulfill({
        status: 200,
        json: { 
          id: "item-123", make: "Porsche", model: "911 GT3", year: 2024,
          vin: "1HGCM82633A000000", location: "Los Angeles, CA", mileage: 500,
          description: "Pristine condition GT3.", condition: "EXCELLENT",
          isNoReserve: true, status: "DRAFT", isModified: false,
          hasServiceHistory: false, seller: { id: 1, username: "testuser" },
          images: [{ id: "img-1", url: "http://example.com/mock.jpg", category: "MAIN", sortOrder: 0 }],
          thumbnailUrl: null, fuelType: null, horsepower: null, titleStatus: null,
          reservePrice: null, engine: null, drivetrain: null, transmission: null,
          bodyStyle: null, exteriorColor: null, interiorColor: null, sellerType: null,
          auctionId: null, auction: null
        }
      });
    });

    // Navigate and fill item form
    await page.goto('/sell-car');
    
    // Dismiss cookie consent if it appears
    await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
    
    await page.click('button:has-text("Start listing")');
    await expect(page.locator('h1', { hasText: 'Sell Your Car' })).toBeVisible();

    // Step 1
    await page.fill('input[name="vin"]', '1HGCM82633A000000');
    await page.selectOption('select[name="year"]', '2024');
    await page.fill('input[name="make"]', 'Porsche');
    await page.fill('input[name="model"]', '911 GT3');
    await page.click('button:has-text("Next Step")');

    // Step 2
    await page.fill('input[name="mileage"]', '500');
    await page.fill('input[name="location"]', 'Los Angeles, CA');
    await page.click('button:has-text("Next Step")');

    // Step 3
    await page.fill('input[name="exteriorColor"]', 'Guards Red');
    await page.fill('textarea[name="description"]', 'Pristine condition GT3.');
    await page.click('button:has-text("Next Step")');

    // Step 4
    await page.check('input[name="isNoReserve"]');
    await page.click('button:has-text("Next Step")');

    // Step 5
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/dummy.png');
    await page.click('button:has-text("Create Listing")');

    // Wait for redirect to Item Details
    await expect(page).toHaveURL(/.*\/items\/item-123/, { timeout: 5000 });
    
    // Verify that the uploaded image is rendered
    const mainImage = page.locator('img.main-img-hover');
    await expect(mainImage).toBeVisible();
    // The browser will attempt to load the mock URL, fail, and the onError handler will replace it
    await expect(mainImage).toHaveAttribute('src', 'https://placehold.co/600x400/eeeeee/999999?text=Image+Not+Found');
    
    // Now verify we see "List for Auction" button since status is DRAFT
    console.log("WAITING FOR LIST BUTTON, HTML IS:");
    console.log(await page.content());
    const listBtn = page.locator('button:has-text("List for Auction")');
    await expect(listBtn).toBeVisible();

    // 5. Mock auction creation
    await page.route('**/api/v1/auctions', async route => {
      await route.fulfill({
        status: 201,
        json: { id: "auction-1", status: "PENDING_APPROVAL" }
      });
    });

    // 6. Mock subsequent item fetch (PENDING_AUCTION state)
    await page.route('**/api/v1/items/item-123', async route => {
      await route.fulfill({
        status: 200,
        json: { 
          id: "item-123", make: "Porsche", model: "911 GT3", year: 2024,
          vin: "1HGCM82633A000000", location: "Los Angeles, CA", mileage: 500,
          description: "Pristine condition GT3.", condition: "EXCELLENT",
          isNoReserve: true, status: "PENDING_AUCTION", isModified: false,
          hasServiceHistory: false, seller: { id: 1, username: "testuser" },
          images: [{ id: "img-1", url: "http://example.com/mock.jpg", category: "MAIN", sortOrder: 0 }],
          thumbnailUrl: null, fuelType: null, horsepower: null, titleStatus: null,
          reservePrice: null, engine: null, drivetrain: null, transmission: null,
          bodyStyle: null, exteriorColor: null, interiorColor: null, sellerType: null,
          auctionId: "auction-1", auction: { id: "auction-1", status: "PENDING_APPROVAL" }
        }
      });
    });

    // Proceed to create auction
    await listBtn.click();
    await expect(page.locator('h2', { hasText: 'Vehicle Review' })).toBeVisible(); // Step 1 Modal
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('h2', { hasText: 'Bidding Rules' })).toBeVisible(); // Step 2 Modal
    await page.fill('input[type="number"]', '10000'); // Starting Bid
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('h2', { hasText: 'Final Review' })).toBeVisible(); // Step 3 Modal
    await page.click('button:has-text("Submit for Approval")');

    // Should refresh item details and show "IN REVIEW" status
    await expect(page.locator('text=IN REVIEW')).toBeVisible({ timeout: 5000 });
  });
});
