import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/profile';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/profile';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Profile Screenshot: ${filename}`);
}

async function createAuthenticatedContext(browser: any, user: { username: string; password: string }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const loginRes = await context.request.post('http://localhost:8080/api/v1/auth/login', {
    data: { username: user.username, password: user.password },
  });

  if (loginRes.ok()) {
    const data = await loginRes.json();
    await context.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, data.token);
  }

  const page = await context.newPage();
  return { context, page };
}

test.describe('User Profile UI Tests (Positive & Negative)', () => {

  test('Step 1 [Negative]: Unauthenticated Profile Access Redirects to Login', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/profile');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify redirected to login with redirect param
      await expect(page).toHaveURL(/.*login\?redirect=%2Fprofile/);
      await expect(page.getByText(/Please enter your details to sign in/i)).toBeVisible({ timeout: 5000 });

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

      await saveScreenshot(session.page, 'profile_02_overview.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 3 [Positive]: Profile User Listings Section', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/profile');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.getByText(/seller_john/i).first()).toBeVisible({ timeout: 10000 });

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

      // Click Edit Profile button if present
      const editBtn = session.page.locator('button:has-text("Edit Profile")').first();
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.click();
        await session.page.waitForTimeout(500);
      }

      await saveScreenshot(session.page, 'profile_04_edit_profile.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 5 [Positive]: Garage Inventory Item Details View', async ({ browser }) => {
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

      await expect(session.page.locator('.vehicle-header-wrapper')).toBeVisible({ timeout: 10000 });
      await expect(session.page.getByText(/Listing Status/i)).toBeVisible();

      await saveScreenshot(session.page, 'profile_05_garage_item_details.png');
    } finally {
      await session.context.close();
    }
  });
});

