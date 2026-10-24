import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Add cookie consent to localStorage to prevent the banner from blocking UI interactions
    await page.addInitScript(() => {
      window.localStorage.setItem('cookieConsent', 'accepted');
    });
  });

  test('Google OAuth login view and redirects to correct authorization URL', async ({ page }) => {
    // Intercept the backend OAuth redirect endpoint
    await page.route('**/oauth2/authorization/google', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Mocked Google OAuth Endpoint</body></html>'
      });
    });

    await page.goto('/');
    
    // Click Sign In
    await page.getByRole('link', { name: 'Sign In' }).first().click();
    
    // Expect Google Auth card header
    await expect(page.locator('h2', { hasText: 'Sign in with your Google account to continue' })).toBeVisible();

    // Verify username and password forms are NOT present
    await expect(page.locator('input[placeholder="Enter your username"]')).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

    // Click the Google button
    await page.click('button:has-text("Continue with Google")');

    // Verify the application attempted to navigate to the correct backend OAuth endpoint
    await page.waitForURL('**/oauth2/authorization/google');
    await expect(page).toHaveURL(/\/oauth2\/authorization\/google/);
  });

  test('Create Password modal validates matching password and creates password', async ({ page }) => {
    let passwordSet = false;
    await page.route('**/api/v1/users/me/password', async route => {
      passwordSet = true;
      await route.fulfill({ json: { message: "Password created successfully" } });
    });

    await page.goto('/?setup_password=1');

    // Modal appears
    await expect(page.getByText('Create Account Password')).toBeVisible();

    // Fill password and mismatched confirm
    await page.fill('input[placeholder="At least 6 characters"]', 'newsecret123');
    await page.fill('input[placeholder="Repeat new password"]', 'mismatched123');
    await page.click('button:has-text("Set Password")');

    await expect(page.getByText('Passwords do not match')).toBeVisible();

    // Fix confirm password
    await page.fill('input[placeholder="Repeat new password"]', 'newsecret123');
    await page.click('button:has-text("Set Password")');

    await expect(page.getByText(/Password created successfully/i)).toBeVisible();
    expect(passwordSet).toBe(true);
  });
});
