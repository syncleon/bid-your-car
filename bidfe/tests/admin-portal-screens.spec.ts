import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/admin-portal';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/admin-portal';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Admin Portal Screenshot: ${filename}`);
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
  } else {
    console.error(`Login failed for ${user.username}: ${loginRes.status()}`);
  }

  const page = await context.newPage();
  return { context, page };
}

test.describe('Admin Portal UI Tests (Positive & Negative)', () => {

  test('Step 1 [Negative]: Regular User Forbidden from Admin Portal and Redirected to Home', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'turbo_collector',
      password: 'password123',
    });

    try {
      await session.page.goto('/admin');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // AdminRoute redirects non-admin users to '/'
      await expect(session.page).toHaveURL('/', { timeout: 10000 });
      await session.page.waitForTimeout(1000);

      await saveScreenshot(session.page, 'admin_01_forbidden_redirect.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 2 [Positive]: Admin User Accesses Admin Dashboard Overview', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'admin',
      password: 'password123',
    });

    try {
      await session.page.goto('/admin');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Expect dashboard header
      await expect(session.page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 10000 });
      await session.page.waitForTimeout(1000);

      await saveScreenshot(session.page, 'admin_02_dashboard_overview.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 3 [Positive]: Admin User Views Users Management Table', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'admin',
      password: 'password123',
    });

    try {
      await session.page.goto('/admin/users');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Wait for table to load
      await session.page.waitForTimeout(1500);

      await saveScreenshot(session.page, 'admin_03_users_management.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 4 [Positive]: Admin User Views Auctions Moderation Queue', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'admin',
      password: 'password123',
    });

    try {
      await session.page.goto('/admin/auctions');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Wait for auctions to load
      await session.page.waitForTimeout(1500);

      await saveScreenshot(session.page, 'admin_04_auctions_moderation.png');
    } finally {
      await session.context.close();
    }
  });

});
