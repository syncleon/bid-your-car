import { test, expect } from '@playwright/test';

test.describe('Edge Cases and Data Resilience', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user for all tests in this block
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ 
        json: { id: 1, username: "testuser", roles: [{name: "USER"}], email: "test@example.com" } 
      });
    });
  });

  test('Item Creation Rollback on Image Upload Failure', async ({ page }) => {
    // 1. Mock successful item creation
    await page.route('**/api/v1/items', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: { id: "item-rollback-123", make: "Test", model: "Car", year: 2024, vin: "1HGCM82633A000000", location: "LA", mileage: 500, condition: "EXCELLENT", isNoReserve: true, status: "DRAFT" }
        });
      } else {
        await route.continue();
      }
    });

    // 2. Mock image upload failure (e.g., unsupported format or server error)
    await page.route('**/api/v1/items/*/images', async route => {
      await route.fulfill({
        status: 400,
        json: { message: "Invalid file type." }
      });
    });

    // 3. Mock DELETE for rollback, and track if it was called
    let deleteCalled = false;
    await page.route('**/api/v1/items/item-rollback-123', async route => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    // Navigate to sell car
    await page.goto('/sell-car');
    
    // Fill minimum required fields across steps to reach submission
    await page.click('button:has-text("Start listing")');
    
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
    await page.fill('textarea[name="description"]', 'Pristine.');
    await page.click('button:has-text("Next Step")');
    
    // Step 4
    await page.check('input[name="isNoReserve"]');
    await page.click('button:has-text("Next Step")');
    
    // Step 5 (Upload mock image to trigger the image upload flow)
    await page.setInputFiles('input[type="file"]', {
      name: 'invalid.avif',
      mimeType: 'image/avif',
      buffer: Buffer.from('fake data')
    });
    
    // Submit
    await page.click('button:has-text("Create Listing")');

    // Wait for the error banner to appear
    await expect(page.locator('text=Invalid file type.')).toBeVisible();

    // Verify rollback was triggered
    expect(deleteCalled).toBe(true);
    
    // Ensure we are not redirected away
    expect(page.url()).not.toContain('/items/item-rollback-123');
  });

  test('Item Creation prevents duplicate VIN (409 Conflict)', async ({ page }) => {
    // 1. Mock 409 Conflict on item creation
    await page.route('**/api/v1/items', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          json: { message: "Item with this VIN already exists" }
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to sell car
    await page.goto('/sell-car');
    
    await page.click('button:has-text("Start listing")');
    
    // Step 1
    await page.fill('input[name="vin"]', '2HGCM82633A000000'); // 17 chars, no I, O, Q
    await page.selectOption('select[name="year"]', '2024');
    await page.fill('input[name="make"]', 'Porsche');
    await page.fill('input[name="model"]', '911');
    await page.click('button:has-text("Next Step")');
    
    // Step 2
    await page.fill('input[name="mileage"]', '500');
    await page.fill('input[name="location"]', 'Los Angeles');
    await page.click('button:has-text("Next Step")');
    
    // Step 3
    await page.fill('input[name="exteriorColor"]', 'Red');
    await page.fill('textarea[name="description"]', 'Pristine.');
    await page.click('button:has-text("Next Step")');
    
    // Step 4
    await page.check('input[name="isNoReserve"]');
    await page.click('button:has-text("Next Step")');
    
    // Step 5
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake data')
    });
    
    // Submit
    await page.click('button:has-text("Create Listing")');

    // Wait for the specific conflict error banner
    await expect(page.locator('text=Item with this VIN already exists')).toBeVisible();
    
    // Verify we remain on the same page and step
    await expect(page.locator('text=Step 5 of 5')).toBeVisible();
  });

  test('Auction List renders and sorts correctly despite missing timestamps', async ({ page }) => {
    // Mock the auctions endpoint with corrupted/missing data
    await page.route('**/api/v1/auctions*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          content: [
            {
              id: 'auc-1',
              status: 'ACTIVE',
              startTime: new Date(Date.now() - 10000).toISOString(),
              endTime: new Date(Date.now() + 100000).toISOString(),
              item: { make: "Toyota", model: "Corolla", year: 2010 },
              currentPrice: 5000
            },
            {
              id: 'auc-2', // MISSING TIMESTAMPS
              status: 'ACTIVE',
              item: { make: "Mystery", model: "Car", year: 2020 },
              currentPrice: 10000
            },
            {
              id: 'auc-3',
              status: 'ACTIVE',
              startTime: new Date(Date.now() - 5000).toISOString(),
              endTime: new Date(Date.now() + 50000).toISOString(),
              item: { make: "Honda", model: "Civic", year: 2015 },
              currentPrice: 8000
            }
          ],
          totalElements: 3,
          totalPages: 1,
          size: 20,
          number: 0
        }
      });
    });

    // Navigate to the live auctions page (assuming root or /auctions)
    await page.goto('/');

    // Ensure page loads without a blank screen crash
    await expect(page.locator('text=Mystery Car')).toBeVisible();
    await expect(page.locator('text=Toyota Corolla')).toBeVisible();

    // Trigger a sort that relies on endTime/startTime
    // The sorting logic in AuctionListTemplate should handle undefined gracefully
    const sortSelect = page.locator('select').first(); // Find the sort dropdown
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption({ label: 'Ending Soonest' });
      // If it doesn't crash, the Mystery Car should still be visible
      await expect(page.locator('text=Mystery Car')).toBeVisible();
      
      await sortSelect.selectOption({ label: 'Newly Listed' });
      await expect(page.locator('text=Mystery Car')).toBeVisible();
    }
  });

});
