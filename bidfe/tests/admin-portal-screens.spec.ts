import { test, expect } from '@playwright/test';
import { createScreenshotSaver, createAuthenticatedContext } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('admin-portal');

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
      await session.page.waitForTimeout(500);

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
      await session.page.waitForTimeout(500);

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

      await expect(session.page.getByRole('heading', { name: 'Manage Users' })).toBeVisible({ timeout: 10000 });
      await session.page.waitForTimeout(1000);

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

      await expect(session.page.getByRole('heading', { name: 'Auctions Management' }).or(session.page.getByText(/Auctions/i).first())).toBeVisible({ timeout: 10000 });
      await session.page.waitForTimeout(1000);

      await saveScreenshot(session.page, 'admin_04_auctions_moderation.png');
    } finally {
      await session.context.close();
    }
  });

});
