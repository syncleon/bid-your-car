import { test, expect } from '@playwright/test';

test.describe('Sell a Car Flow', () => {
  test('creates a new vehicle listing successfully', async ({ page }) => {
    // 1. Mock the authenticated user
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ 
        json: { id: 1, username: "testuser", roles: [{name: "USER"}], email: "test@example.com" } 
      });
    });

    // 2. Mock the item creation API response
    await page.route('**/api/v1/items', async route => {
      // Simulate successful creation and return a full mock item to satisfy MST validation
      await route.fulfill({
        status: 201,
        json: { 
          id: "item-123", 
          make: "Porsche", 
          model: "911 GT3", 
          year: 2024,
          vin: "1HGCM82633A000000",
          location: "Los Angeles, CA",
          mileage: 500,
          description: "Pristine condition GT3.",
          condition: "EXCELLENT",
          isNoReserve: true,
          status: "PENDING_AUCTION",
          isModified: false,
          hasServiceHistory: false,
          seller: { id: 1, username: "testuser" },
          images: [],
          thumbnailUrl: null,
          fuelType: null,
          horsepower: null,
          titleStatus: null,
          reservePrice: null,
          engine: null,
          drivetrain: null,
          transmission: null,
          bodyStyle: null,
          exteriorColor: null,
          interiorColor: null,
          sellerType: null,
          auctionId: null,
          auction: null
        }
      });
    });

    // 3. Mock the image upload API response
    await page.route('**/api/v1/items/*/images', async route => {
      await route.fulfill({
        status: 201,
        json: { id: "img-1", url: "http://example.com/mock.jpg", category: "MAIN" }
      });
    });

    // 4. Mock the item fetch API response for the redirect
    await page.route('**/api/v1/items/item-123', async route => {
      await route.fulfill({
        status: 200,
        json: { 
          id: "item-123", 
          make: "Porsche", 
          model: "911 GT3", 
          year: 2024,
          vin: "1HGCM82633A000000",
          location: "Los Angeles, CA",
          mileage: 500,
          description: "Pristine condition GT3.",
          condition: "EXCELLENT",
          isNoReserve: true,
          status: "PENDING_AUCTION",
          isModified: false,
          hasServiceHistory: false,
          seller: { id: 1, username: "testuser" },
          images: [{ id: "img-1", url: "http://example.com/mock.jpg", category: "MAIN", sortOrder: 0 }],
          thumbnailUrl: null,
          fuelType: null,
          horsepower: null,
          titleStatus: null,
          reservePrice: null,
          engine: null,
          drivetrain: null,
          transmission: null,
          bodyStyle: null,
          exteriorColor: null,
          interiorColor: null,
          sellerType: null,
          auctionId: null,
          auction: null
        }
      });
    });

    // Navigate to the sell page
    await page.goto('/sell-car');
    
    // Click Start Your Listing
    await page.click('button:has-text("Start Your Listing")');

    // Wait for the form page to render
    await expect(page.locator('h1', { hasText: 'Sell Your Car' })).toBeVisible();

    // --- STEP 1: Identity ---
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
    await page.fill('input[name="vin"]', '1HGCM82633A000000'); // 17 chars
    await page.selectOption('select[name="year"]', '2024');
    await page.fill('input[name="make"]', 'Porsche');
    await page.fill('input[name="model"]', '911 GT3');
    
    await page.click('button:has-text("Next Step")');

    // --- STEP 2: Specs ---
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    await page.fill('input[name="mileage"]', '500');
    await page.fill('input[name="location"]', 'Los Angeles, CA');
    
    await page.click('button:has-text("Next Step")');

    // --- STEP 3: Condition & Details ---
    await expect(page.locator('text=Step 3 of 5')).toBeVisible();
    await page.fill('input[name="exteriorColor"]', 'Guards Red');
    await page.fill('textarea[name="description"]', 'Pristine condition GT3.');
    
    await page.click('button:has-text("Next Step")');

    // --- STEP 4: Pricing & Rules ---
    await expect(page.locator('text=Step 4 of 5')).toBeVisible();
    // Choose No Reserve
    await page.check('input[name="isNoReserve"]');
    
    await page.click('button:has-text("Next Step")');

    // --- STEP 5: Photos ---
    await expect(page.locator('text=Step 5 of 5')).toBeVisible();
    
    // Test the "Main Cover" functionality
    await page.setInputFiles('input[type="file"]', [
      { name: 'cover.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake image data 1') },
      { name: 'side.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake image data 2') }
    ]);
    
    // Verify that the first uploaded image is marked as the Main Cover
    await expect(page.locator('text=Main Cover (Unsaved)')).toBeVisible();
    // Verify that the second uploaded image is just marked as EXTERIOR
    await expect(page.locator('text=EXTERIOR (Unsaved)')).toBeVisible();
    
    // Submit the form
    await page.click('button:has-text("Create Listing")');

    // Debug: Check if an error banner appears
    await expect(page.locator('text=⚠️')).not.toBeVisible({ timeout: 5000 });

    // Wait for redirect to the newly created item details page
    await expect(page).toHaveURL(/.*\/items\/item-123/, { timeout: 5000 });
  });
});
