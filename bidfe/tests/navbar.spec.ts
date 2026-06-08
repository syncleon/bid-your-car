import { test, expect } from '@playwright/test';

test.describe('Navbar Component', () => {
  test('renders "Sign In" button when user is unauthenticated', async ({ page }) => {
    // Mock user endpoint to return 401 Unauthorized
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    // Mock auctions feed
    await page.route('**/api/v1/auctions*', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } });
    });

    await page.goto('/');

    // Verify "Sign In" button is visible
    const signInBtn = page.getByRole('link', { name: 'Sign In' }).first();
    await expect(signInBtn).toBeVisible();

    // Verify Avatar is not visible
    await expect(page.locator('.navbar-profile-avatar')).not.toBeVisible();
  });

  test('renders user menu link when user is authenticated', async ({ page }) => {
    // Mock user endpoint to return an authenticated user
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'testuser', roles: [{ name: 'USER' }], email: 'test@example.com' }
      });
    });

    // Mock auctions feed
    await page.route('**/api/v1/auctions*', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } });
    });

    await page.goto('/');

    // Verify "Sign In" button is NOT visible
    await expect(page.getByRole('link', { name: 'Sign In' })).not.toBeVisible();

    // Verify User Menu Trigger is visible
    const userMenu = page.locator('.user-menu__trigger');
    await expect(userMenu).toBeVisible();
    await expect(userMenu).toContainText('testuser'); // Username should be displayed

    // Click User Menu to go to profile
    await userMenu.click();
    await expect(page).toHaveURL(/.*\/profile/);
  });
});
