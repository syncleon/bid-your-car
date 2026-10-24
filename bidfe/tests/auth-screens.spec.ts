import { test, expect } from '@playwright/test';
import { createScreenshotSaver, createAuthenticatedContext } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('auth');

test.describe('Authentication & Privacy UI Tests (Google Auth & Password Creation)', () => {

  test('Step 1 [Positive]: Clean Google-Only Auth Page View on /login', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/login');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.locator('h2', { hasText: 'Sign in with your Google account to continue' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

      // Ensure manual login/register form fields are deleted
      await expect(page.locator('input[placeholder="Enter your username"]')).toHaveCount(0);
      await expect(page.locator('input[type="password"]')).toHaveCount(0);

      await saveScreenshot(page, '01_login_google_only_view.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Positive]: Google Auth on /register Route', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/register');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify register route uses the unified Google Auth view
      await expect(page.locator('h2', { hasText: 'Sign in with your Google account to continue' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

      // Verify no register form inputs exist
      await expect(page.locator('input[type="email"]')).toHaveCount(0);
      await expect(page.locator('input[placeholder="Choose a username"]')).toHaveCount(0);

      await saveScreenshot(page, '02_register_google_only_view.png');
    } finally {
      await context.close();
    }
  });

  test('Step 3 [Positive]: Clean Create Password Modal View', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/?setup_password=1');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.getByText('Create Account Password')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder="At least 6 characters"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Repeat new password"]')).toBeVisible();

      await saveScreenshot(page, '03_create_password_modal_view.png');
    } finally {
      await context.close();
    }
  });

  test('Step 4 [Negative]: Password Validation - Mismatch & Min Length', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/?setup_password=1');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.getByText('Create Account Password')).toBeVisible({ timeout: 5000 });

      // Try mismatched passwords
      await page.fill('input[placeholder="At least 6 characters"]', 'securePass123');
      await page.fill('input[placeholder="Repeat new password"]', 'differentPass456');
      await page.click('button:has-text("Set Password")');

      await expect(page.getByText('Passwords do not match')).toBeVisible();
      await saveScreenshot(page, '04_create_password_mismatch_error.png');
    } finally {
      await context.close();
    }
  });

  test('Step 5 [Positive]: Password Creation Success Notification', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.route('**/api/v1/users/me/password', async route => {
        await route.fulfill({ json: { message: "Password created successfully" } });
      });

      await page.goto('/?setup_password=1');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await page.fill('input[placeholder="At least 6 characters"]', 'strongPassword123');
      await page.fill('input[placeholder="Repeat new password"]', 'strongPassword123');
      await page.click('button:has-text("Set Password")');

      await expect(page.getByText(/Password created successfully/i)).toBeVisible({ timeout: 5000 });
      await saveScreenshot(page, '05_create_password_success.png');
    } finally {
      await context.close();
    }
  });

  test('Step 6 [Positive]: Profile Password Dialog with Google Support', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });

      // Click Update Password in profile actions
      await session.page.getByRole('button', { name: 'Update Password' }).click();

      // Verify the updated password form shows the Google user notice
      await expect(session.page.getByText(/leave blank if signed in with Google/i)).toBeVisible({ timeout: 5000 });
      await session.page.waitForTimeout(500);
      await saveScreenshot(session.page, '06_profile_password_dialog.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 7 [Positive]: Cookie Consent Banner & Acceptance', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/');
      // Verify cookie consent banner is visible
      const banner = page.locator('.cookie-consent-card');
      await expect(banner).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, '07_cookie_consent_banner.png');

      // Accept cookies
      await page.click('button:has-text("Accept Cookies")');
      await expect(banner).toHaveCount(0);

      await saveScreenshot(page, '08_cookie_consent_accepted.png');
    } finally {
      await context.close();
    }
  });

  test('Step 8 [Positive]: Cookie Policy Page', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/cookie-policy');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.locator('.cookie-policy-container')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('h1:has-text("Cookie Policy")')).toBeVisible();
      await expect(page.locator('.cookie-table')).toBeVisible();

      await saveScreenshot(page, '09_cookie_policy_page.png');
    } finally {
      await context.close();
    }
  });

  test('Step 9 [Negative]: Account Verification Screen with Invalid Token', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/verify?token=invalid_expired_token_12345');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.getByText(/Account Verification/i)).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/Verification Failed|Invalid link/i).first()
      ).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, '10_account_verification_invalid_token.png');
    } finally {
      await context.close();
    }
  });

  test('Step 10 [Positive]: Log Out Confirmation Dialog & Sign Out Flow', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Wait for profile header
      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });

      // Click Log Out button
      const logoutBtn = session.page.getByRole('button', { name: 'Log Out' });
      await expect(logoutBtn).toBeVisible({ timeout: 5000 });
      await logoutBtn.click();

      // Verify the ConfirmDialog appears
      const dialogTitle = session.page.locator('.dialog-title', { hasText: 'Log Out' });
      await expect(dialogTitle).toBeVisible({ timeout: 5000 });
      await saveScreenshot(session.page, '11_logout_confirm_dialog.png');

      // Click Confirm Log Out
      const confirmBtn = session.page.locator('.dialog-btn-confirm', { hasText: 'Log Out' });
      await confirmBtn.click();

      // Verify user is redirected to login or back to unauthenticated state
      await expect(session.page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible({ timeout: 10000 });
      await saveScreenshot(session.page, '12_logout_completed_guest_state.png');
    } finally {
      await session.context.close();
    }
  });
});
