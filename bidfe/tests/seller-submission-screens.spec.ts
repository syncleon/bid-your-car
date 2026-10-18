import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = '/Users/syncleon/.gemini/antigravity/brain/ed091e2a-be58-4de9-b49f-b5e75719a85b/screenshots/seller-submission';
const LOCAL_DIR = '/Users/syncleon/bidyourcarua/bid-your-car/bidfe/tests/screenshots/seller-submission';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

async function saveScreenshot(pageOrLocator: any, filename: string, options: any = {}) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const localPath = path.join(LOCAL_DIR, filename);
  await pageOrLocator.screenshot({ path: artifactPath, ...options });
  await pageOrLocator.screenshot({ path: localPath, ...options });
  console.log(`📸 Saved Seller Screenshot: ${filename}`);
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

test.describe('Seller Vehicle Submission UI Tests (Positive & Negative)', () => {

  test('Step 1 [Positive]: Sell Car Landing Page', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/sell-car');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify landing page hero and CTA
      await expect(page.locator('.hero-title')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button:has-text("Submit Your Vehicle")')).toBeVisible();

      await saveScreenshot(page, 'seller_01_sell_car_landing.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [Negative]: Unauthenticated User Redirected to Login', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      // Visit protected submission page as guest
      await page.goto('/sell-car/submit');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify redirected to login with redirect param
      await expect(page).toHaveURL(/.*login\?redirect=%2Fsell-car%2Fsubmit/);
      await expect(page.getByText(/Please enter your details to sign in/i)).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, 'seller_02_unauthenticated_guard.png');
    } finally {
      await context.close();
    }
  });

  test('Step 3 [Positive]: Authenticated Vehicle Submission Form', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      // Verify submission form step 1
      const form = session.page.locator('.submit-form-card');
      await expect(form).toBeVisible({ timeout: 10000 });
      await expect(session.page.locator('input[name="vin"]')).toBeVisible({ timeout: 5000 });

      await saveScreenshot(session.page, 'seller_03_vehicle_submit_form.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 4 [Negative]: Submitting Step 1 Without Required Fields Shows Validation', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.locator('.submit-form-card')).toBeVisible({ timeout: 10000 });

      // Click Continue without filling VIN
      const continueBtn = session.page.locator('button:has-text("Continue")').first();
      await continueBtn.click();

      // Expect validation error for VIN
      await expect(session.page.locator('.error-text')).toBeVisible({ timeout: 5000 });

      await saveScreenshot(session.page, 'seller_04_submit_form_validation.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 5 [Positive]: Step 2 Vehicle Basic Details Form', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.locator('.submit-form-card')).toBeVisible({ timeout: 10000 });

      const testVin = '1HGCR2F8' + Math.floor(100000000 + Math.random() * 900000000).toString();
      await session.page.fill('input[name="vin"]', testVin);
      await session.page.waitForTimeout(800);

      const continueBtn = session.page.locator('button:has-text("Continue")').first();
      await continueBtn.click();

      await expect(session.page.getByText(/Step 2 of 8/i)).toBeVisible({ timeout: 5000 });
      await session.page.waitForTimeout(300);

      await saveScreenshot(session.page, 'seller_05_step2_basic_details.png');
    } finally {
      await session.context.close();
    }
  });
});

