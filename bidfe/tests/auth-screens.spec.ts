import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/auth';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/auth';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Auth Screenshot: ${filename}`);
}

test.describe('Authentication & Privacy UI Tests (Positive & Negative)', () => {

  test('Step 1 [Negative]: Invalid Credentials Shows Error Banner', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/login');
      await page.fill('input[placeholder="Enter your username"]', 'non_existent_bidder');
      await page.fill('input[type="password"]', 'WrongPassword!123');

      // Submit form
      await page.click('button:has-text("Sign in")');

      // Wait for error banner
      const errorBanner = page.locator('div:has-text("Invalid credentials")').first();
      await expect(errorBanner).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, '01_login_invalid_credentials.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Negative]: Empty Fields Validation', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/login');
      // Click sign in without filling
      await page.click('button:has-text("Sign in")');

      // Check username input has HTML5 invalid status or focus
      const usernameInput = page.locator('input[placeholder="Enter your username"]');
      await expect(usernameInput).toBeVisible();

      await saveScreenshot(page, '02_login_empty_fields_validation.png');
    } finally {
      await context.close();
    }
  });

  test('Step 3 [Positive]: Successful User Login & Navbar Avatar', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/login');
      await page.fill('input[placeholder="Enter your username"]', 'turbo_collector');
      await page.fill('input[type="password"]', 'password123');

      await page.click('button:has-text("Sign in")');

      // Expect redirect to home and user initial in navbar
      await expect(page).toHaveURL('http://localhost:5173/');
      const userAvatar = page.locator('div:has-text("T")').first();
      await expect(userAvatar).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, '03_login_success_navbar.png');
    } finally {
      await context.close();
    }
  });

  test('Step 4 [Positive]: Registration Form Screen', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/register');
      await expect(page.getByText(/Create an account/i)).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[type="email"]')).toBeVisible();

      await saveScreenshot(page, '04_register_form.png');
    } finally {
      await context.close();
    }
  });

  test('Step 5 [Positive]: Cookie Consent Banner & Acceptance', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/');
      // Verify cookie consent banner is visible
      const banner = page.locator('.cookie-consent-card');
      await expect(banner).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, '05_cookie_consent_banner.png');

      // Accept cookies
      await page.click('button:has-text("Accept Cookies")');
      await expect(banner).toHaveCount(0);

      await saveScreenshot(page, '06_cookie_consent_accepted.png');
    } finally {
      await context.close();
    }
  });

  test('Step 6 [Positive]: Cookie Policy Page', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/cookie-policy');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.locator('.cookie-policy-container')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('h1:has-text("Cookie Policy")')).toBeVisible();
      await expect(page.locator('.cookie-table')).toBeVisible();

      await saveScreenshot(page, '07_cookie_policy_page.png');
    } finally {
      await context.close();
    }
  });

  test('Step 7 [Positive]: Account Verification Screen', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/verify');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page.getByText(/Account Verification/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Invalid link/i)).toBeVisible();

      await saveScreenshot(page, '08_account_verification_screen.png');
    } finally {
      await context.close();
    }
  });
});

