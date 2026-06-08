import { test, expect } from '@playwright/test';

test.describe('Profile Page Actions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the user endpoint to simulate an authenticated user
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'testuser', roles: [{ name: 'USER' }], email: 'test@example.com' }
      });
    });

    // Mock the profile data endpoint
    await page.route('**/api/v1/users/me/profile', async route => {
      await route.fulfill({
        json: {
          bio: 'Test bio',
          phoneNumber: '123-456-7890',
          memberSince: new Date().toISOString()
        }
      });
    });

    // Mock the user items endpoint for the garage
    await page.route('**/api/v1/users/me/items', async route => {
      await route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } }); // Empty garage
    });

    await page.goto('/profile');
  });

  test('Log Out flow opens ConfirmDialog and executes logout', async ({ page }) => {
    // Wait for the profile to load
    await expect(page.locator('h1.profile-username')).toHaveText('@testuser');

    // Mock logout API
    let logoutCalled = false;
    await page.route('**/api/v1/auth/logout', async route => {
      logoutCalled = true;
      await route.fulfill({ status: 200, json: { message: 'Logged out successfully' } });
    });

    // Click "Log Out" button
    await page.getByRole('button', { name: 'Log Out' }).click();

    // Verify the ConfirmDialog appears
    const dialogTitle = page.locator('.dialog-title', { hasText: 'Log Out' });
    await expect(dialogTitle).toBeVisible();

    const dialogMessage = page.locator('.dialog-message', { hasText: 'Are you sure you want to log out?' });
    await expect(dialogMessage).toBeVisible();

    // Click "Log Out" confirm button inside the dialog
    const confirmBtn = page.locator('.dialog-btn-confirm', { hasText: 'Log Out' });
    await confirmBtn.click();

    // Wait and verify logout was called
    // Typically our mobx store will call clearAuth and navigate to '/login' or '/'
    await expect(async () => {
      expect(logoutCalled).toBe(true);
    }).toPass();
  });

  test('Deactivate Account flow opens PromptDialog and executes delete on confirm', async ({ page }) => {
    // Wait for the profile to load
    await expect(page.locator('h1.profile-username')).toHaveText('@testuser');

    // Mock delete account API
    let deleteCalled = false;
    await page.route('**/api/v1/users/me', async route => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 200, json: { message: 'Account deleted' } });
      } else {
        await route.continue();
      }
    });

    // Click "Deactivate Account" button
    await page.getByRole('button', { name: 'Deactivate Account' }).click();

    // Verify the PromptDialog appears
    const dialogTitle = page.locator('.dialog-title', { hasText: 'Delete Account' });
    await expect(dialogTitle).toBeVisible();

    const dialogMessage = page.locator('.dialog-message', { hasText: 'This action is permanent and cannot be undone. Enter your password to confirm.' });
    await expect(dialogMessage).toBeVisible();

    // Verify confirm button is disabled initially
    const confirmBtn = page.locator('.dialog-btn-confirm', { hasText: 'Delete Account' });
    await expect(confirmBtn).toBeDisabled();

    // Enter password
    await page.getByPlaceholder('Password').fill('mysecretpassword');

    // Verify confirm button is enabled and click it
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Verify delete was called
    await expect(async () => {
      expect(deleteCalled).toBe(true);
    }).toPass();
  });
});
