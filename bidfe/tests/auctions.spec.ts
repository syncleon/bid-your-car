import { test, expect } from '@playwright/test';

test.describe('Auction Feed', () => {
  test('displays auction items on the homepage', async ({ page }) => {
    // Mock the backend API responses for auctions
    await page.route('**/api/v1/auctions*', async route => {
      const json = {
        content: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            item: {
              id: 'item-1',
              make: 'Toyota',
              model: 'Camry',
              year: 2021,
              mileage: 15000,
              description: 'Great condition',
              imageUrls: ['https://example.com/car.jpg'],
              seller: { id: 2, username: 'seller1' }
            },
            status: 'ACTIVE',
            startPrice: 10000,
            currentPrice: 12000,
            minBidIncrement: 500,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 86400000).toISOString(),
            bidCount: 4
          }
        ],
        totalPages: 1,
        totalElements: 1
      };
      await route.fulfill({ json });
    });

    await page.goto('/');
    
    // Expect page title to match
    await expect(page.locator('h1.page-title')).toHaveText('Auctions');
    
    // Wait for the mock item to render
    await expect(page.locator('text=Toyota Camry').first()).toBeVisible();
    await expect(page.locator('text=$12k').first()).toBeVisible();
  });

  test('displays empty state when no auctions available', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/v1/auctions*', async route => {
      const json = {
        content: [],
        totalPages: 0,
        totalElements: 0
      };
      await route.fulfill({ json });
    });

    await page.goto('/');
    
    // Expect empty state text
    await expect(page.locator('text=No vehicles found')).toBeVisible();
  });
});
