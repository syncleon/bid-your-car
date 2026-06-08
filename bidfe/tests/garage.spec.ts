import { test, expect } from '@playwright/test';

test.describe('Garage Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user endpoint
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'garageuser', roles: [{ name: 'USER' }], email: 'garage@example.com' }
      });
    });

    // Mock profile
    await page.route('**/api/v1/users/me/profile', async route => {
      await route.fulfill({ json: {} });
    });
  });

  test('displays empty garage state and allows navigation to sell car', async ({ page }) => {
    // Mock empty garage items
    await page.route('**/api/v1/users/me/items', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } });
    });

    await page.goto('/profile');

    // Verify empty state
    await expect(page.locator('h3.garage-empty-title')).toHaveText('Your garage is empty');
    
    // Verify Sell Car link
    const sellCarBtn = page.locator('.garage-btn-sell', { hasText: 'Sell Your First Car' });
    await expect(sellCarBtn).toBeVisible();
    await expect(sellCarBtn).toHaveAttribute('href', '/sell-car');
  });

  test('displays existing items in garage', async ({ page }) => {
    // Mock garage items
    await page.route('**/api/v1/users/me/items', async route => {
      await route.fulfill({
        json: {
          content: [
            {
              id: 'item-1',
              make: 'Ford',
              model: 'Mustang',
              year: 1969,
              mileage: 50000,
              hasServiceHistory: true,
              isModified: false,
              images: [],
              condition: 'GOOD',
              status: 'DRAFT'
            }
          ],
          totalElements: 1,
          totalPages: 1
        }
      });
    });

    await page.goto('/profile');

    // Verify vehicle is displayed in the grid
    const vehicleCard = page.locator('.garage-grid .base-card-link').first();
    await expect(vehicleCard).toBeVisible();
    
    // Verify vehicle details
    await expect(vehicleCard.locator('h3')).toHaveText('1969 Ford Mustang');
    await expect(vehicleCard.locator('text=Condition: GOOD')).toBeVisible();
  });
});
