import { test, expect } from '@playwright/test';

test.describe('Admin Panel Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user session as Admin
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        json: {
          id: 1,
          username: "adminuser",
          email: "admin@test.com",
          roles: [{ name: "ADMIN" }]
        }
      });
    });
  });

  test('Admin dashboard is accessible', async ({ page }) => {
    // Mock some metrics/data for dashboard if needed
    await page.route('**/api/v1/admin/dashboard', async route => {
      await route.fulfill({ json: { totalUsers: 10, totalAuctions: 5 } });
    });

    await page.goto('/admin');
    
    // Check if the dashboard title is visible
    await expect(page.locator('h1', { hasText: 'Dashboard' }).or(page.locator('h2', { hasText: 'Dashboard' })).first()).toBeVisible();
    
    // Check navigation items
    await expect(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Auctions', exact: true })).toBeVisible();
  });

  test('Admin can view users list', async ({ page }) => {
    // Mock users list API
    await page.route('**/api/v1/users?*', async route => {
      await route.fulfill({
        json: {
          content: [
            { id: 1, username: "adminuser", email: "admin@test.com", enabled: true, profilePhotoUrl: null, roles: [{name: "ADMIN"}] },
            { id: 2, username: "normaluser", email: "user@test.com", enabled: true, profilePhotoUrl: null, roles: [{name: "USER"}] }
          ],
          totalElements: 2
        }
      });
    });

    await page.goto('/admin/users');
    
    // Check if the user list or table is rendered
    await expect(page.getByRole('cell', { name: 'adminuser' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'normaluser' }).first()).toBeVisible();
  });

  test('Admin can view auctions list', async ({ page }) => {
    // Mock auctions list API
    await page.route('**/api/v1/auctions?*', async route => {
      await route.fulfill({
        json: {
          content: [
            { 
              id: "123", 
              item: { year: 2024, make: "Porsche", model: "911 GT3" },
              status: "ACTIVE",
              startTime: null,
              endTime: null
            }
          ],
          totalElements: 1
        }
      });
    });

    await page.goto('/admin/auctions');
    
    // Check if the auction list or table is rendered
    await expect(page.getByText('2024 Porsche 911 GT3')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ACTIVE' })).toBeVisible();
  });
});
