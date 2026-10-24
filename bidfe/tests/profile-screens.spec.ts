import { test, expect } from '@playwright/test';
import { createScreenshotSaver, createAuthenticatedContext } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('profile');

test.describe('User Profile UI Tests (Positive & Negative)', () => {

  test('Step 1 [Negative]: Unauthenticated Profile Access Redirects to Login', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/profile');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify redirected to login with redirect param
      await expect(page).toHaveURL(/.*login\?redirect=%2Fprofile/);
      await expect(page.getByText(/Sign in with your Google account/i)).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, 'profile_01_unauthenticated_guard.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Positive]: Authenticated User Profile Overview', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify profile header with username
      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });
      await expect(session.page.locator('.profile-card')).toBeVisible();

      await saveScreenshot(session.page, 'profile_02_overview.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 3 [Positive]: Profile User Listings Section (My Garage)', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.getByText(/seller_john/i).first()).toBeVisible({ timeout: 10000 });
      await expect(session.page.locator('.garage-section')).toBeVisible({ timeout: 10000 });

      await session.page.waitForTimeout(1000);
      await saveScreenshot(session.page, 'profile_03_user_listings.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 4 [Positive]: Edit Profile Mode', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });

      // Click Edit Profile button
      const editBtn = session.page.locator('button:has-text("Edit Profile")').first();
      await expect(editBtn).toBeVisible({ timeout: 5000 });
      await editBtn.click();
      await session.page.waitForTimeout(500);

      await saveScreenshot(session.page, 'profile_04_edit_profile.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 5 [Positive]: Update Password Mode', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });

      // Click Update Password button
      const pwdBtn = session.page.locator('button:has-text("Update Password")').first();
      await expect(pwdBtn).toBeVisible({ timeout: 5000 });
      await pwdBtn.click();
      await session.page.waitForTimeout(500);

      await saveScreenshot(session.page, 'profile_05_update_password.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 6 [Positive]: Garage Inventory Item Details View', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      const itemsRes = await session.context.request.get('http://localhost:8080/api/v1/users/me/items');
      let itemId = 'beadd607-14a8-4116-8c72-7b42c89c09f1';
      if (itemsRes.ok()) {
        const data = await itemsRes.json();
        if (data.content && data.content.length > 0) {
          itemId = data.content[0].id;
        }
      }

      await session.page.goto(`/items/${itemId}`);
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(session.page.locator('.vehicle-header-wrapper').or(session.page.locator('.item-details-container'))).toBeVisible({ timeout: 10000 });

      await saveScreenshot(session.page, 'profile_06_garage_item_details.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 7 [Positive]: Log Out Confirmation Dialog Flow', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });

      // Click Log Out button
      await session.page.getByRole('button', { name: 'Log Out' }).click();

      // Verify the ConfirmDialog appears
      const dialogTitle = session.page.locator('.dialog-title', { hasText: 'Log Out' });
      await expect(dialogTitle).toBeVisible({ timeout: 5000 });

      await saveScreenshot(session.page, 'profile_07_logout_dialog.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 8 [Positive]: Deactivate Account Prompt Dialog Flow', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.getByText(/turbo_collector/i).first()).toBeVisible({ timeout: 10000 });

      // Click Deactivate Account button
      await session.page.getByRole('button', { name: 'Deactivate Account' }).click();

      // Verify the PromptDialog appears
      const dialogTitle = session.page.locator('.dialog-title', { hasText: 'Delete Account' });
      await expect(dialogTitle).toBeVisible({ timeout: 5000 });

      await saveScreenshot(session.page, 'profile_08_deactivate_dialog.png');
    } finally {
      await session.context.close();
    }
  });
});
