import { test, expect } from '@playwright/test';

test.describe('Real UI Flow', () => {
  test('should display Google auth and allow password creation', async ({ page }) => {
    // 1. Go to /register directly
    await page.goto('/register');
    await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

    // 2. Verify Google Auth Card is displayed (and manual registration form is deleted)
    await expect(page.locator('h2', { hasText: 'Sign in with your Google account to continue' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.locator('input[placeholder="Choose a username"]')).toHaveCount(0);
    await expect(page.locator('input[placeholder="Enter your username"]')).toHaveCount(0);

    // 3. Mock Google OAuth redirect
    await page.route('**/oauth2/authorization/google', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Mocked Google OAuth</body></html>'
      });
    });

    await page.click('button:has-text("Continue with Google")');
    await page.waitForURL('**/oauth2/authorization/google');
    await expect(page).toHaveURL(/\/oauth2\/authorization\/google/);

    // 4. Test post-auth Create Password flow
    await page.route('**/api/v1/users/me/password', async route => {
      await route.fulfill({ json: { message: "Password created successfully" } });
    });

    await page.goto('/?setup_password=1');
    await expect(page.getByText('Create Account Password')).toBeVisible({ timeout: 5000 });

    await page.fill('input[placeholder="At least 6 characters"]', 'mySecurePass123');
    await page.fill('input[placeholder="Repeat new password"]', 'mySecurePass123');
    await page.click('button:has-text("Set Password")');

    await expect(page.getByText(/Password created successfully/i)).toBeVisible({ timeout: 5000 });
  });
});
