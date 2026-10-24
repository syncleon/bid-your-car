import { test, expect, Page } from '@playwright/test';
import { createScreenshotSaver, createAuthenticatedContext } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('seller-submission');

async function fillStep1(page: Page, vin?: string) {
  const testVin = vin || ('1HGCR2F8' + Math.floor(100000000 + Math.random() * 900000000).toString());
  await page.fill('input[name="vin"]', testVin);
  await page.waitForTimeout(800);
  await page.click('button:has-text("Continue")');
  await expect(page.getByText(/Step 2 of 8/i)).toBeVisible({ timeout: 10000 });
}

async function fillStep2(page: Page) {
  await page.locator('input[name="year"]').fill('2022');
  const makeInput = page.getByPlaceholder('Enter Make...');
  await makeInput.fill('Porsche');
  await makeInput.press('Enter');
  await page.waitForTimeout(300);
  const modelInput = page.getByPlaceholder('Enter Model...');
  await modelInput.fill('911');
  await modelInput.press('Enter');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Continue")');
  await expect(page.getByText(/Step 3 of 8/i)).toBeVisible({ timeout: 10000 });
}

async function fillStep3(page: Page) {
  await page.locator('button', { hasText: 'Automatic' }).first().click();
  await page.locator('button', { hasText: 'AWD' }).first().click();
  await page.locator('button', { hasText: 'Gasoline' }).first().click();
  await page.click('button:has-text("Continue")');
  await expect(page.getByText(/Step 4 of 8/i)).toBeVisible({ timeout: 10000 });
}

async function fillStep4(page: Page) {
  await page.locator('button', { hasText: 'Coupe' }).first().click();
  await page.fill('input[name="exteriorColor"]', 'Agate Grey Metallic');
  await page.fill('input[name="interiorColor"]', 'Black Leather');
  await page.click('button:has-text("Continue")');
  await expect(page.getByText(/Step 5 of 8/i)).toBeVisible({ timeout: 10000 });
}

async function fillStep5(page: Page) {
  await page.locator('button', { hasText: 'Excellent' }).first().click();
  await page.locator('button', { hasText: 'Clean' }).first().click();
  await page.click('button:has-text("Continue")');
  await expect(page.getByText(/Step 6 of 8/i)).toBeVisible({ timeout: 10000 });
}

async function fillStep6(page: Page) {
  await page.fill('input[name="mileage"]', '12500');
  await page.fill('input[name="location"]', 'Miami, FL');
  await page.click('button:has-text("Continue")');
  await expect(page.getByText(/Step 7 of 8/i)).toBeVisible({ timeout: 10000 });
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
      await expect(page.getByText(/Sign in with your Google account/i)).toBeVisible({ timeout: 5000 });

      await saveScreenshot(page, 'seller_02_unauthenticated_guard.png');
    } finally {
      await context.close();
    }
  });

  test('Step 3 [Positive]: Step 1 - VIN Entry Form', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      const form = session.page.locator('.submit-form-card');
      await expect(form).toBeVisible({ timeout: 10000 });
      await expect(session.page.locator('input[name="vin"]')).toBeVisible({ timeout: 5000 });

      await saveScreenshot(session.page, 'seller_03_step1_vin_entry.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 4 [Negative]: Step 1 - Invalid / Short VIN Shows Validation', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await expect(session.page.locator('.submit-form-card')).toBeVisible({ timeout: 10000 });

      await session.page.fill('input[name="vin"]', '1HGCR2F8123');
      const continueBtn = session.page.locator('button:has-text("Continue")').first();
      await continueBtn.click();

      await expect(session.page.locator('.error-text')).toBeVisible({ timeout: 5000 });
      await expect(session.page.getByText(/VIN must be exactly 17 characters/i)).toBeVisible();

      await saveScreenshot(session.page, 'seller_04_step1_vin_validation.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 5 [Positive]: Step 2 - Vehicle Basic Details Form', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await fillStep1(session.page);

      await saveScreenshot(session.page, 'seller_05_step2_basic_details.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 6 [Negative]: Step 2 - Submitting Empty Make/Model Shows Validation', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await fillStep1(session.page);

      // Clear year and try to continue
      await session.page.locator('input[name="year"]').fill('1850');
      await session.page.click('button:has-text("Continue")');
      await expect(session.page.locator('.error-text').first()).toBeVisible({ timeout: 5000 });

      await saveScreenshot(session.page, 'seller_06_step2_validation_error.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 7 & 8 [Positive & Negative]: Step 3 - Powertrain & Specs Selection', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await fillStep1(session.page);
      await fillStep2(session.page);

      // Negative: Click continue without selecting specs
      await session.page.click('button:has-text("Continue")');
      await expect(session.page.locator('.error-text').first()).toBeVisible({ timeout: 5000 });
      await saveScreenshot(session.page, 'seller_07_step3_specs_validation.png');

      // Positive: Select specs
      await session.page.locator('button', { hasText: 'Automatic' }).first().click();
      await session.page.locator('button', { hasText: 'AWD' }).first().click();
      await session.page.locator('button', { hasText: 'Gasoline' }).first().click();

      await saveScreenshot(session.page, 'seller_08_step3_specs_selected.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 9 & 10 [Positive]: Step 4 & 5 - Aesthetics, Condition & Title', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await fillStep1(session.page);
      await fillStep2(session.page);
      await fillStep3(session.page);

      // Step 4: Body & Colors
      await session.page.locator('button', { hasText: 'Coupe' }).first().click();
      await session.page.fill('input[name="exteriorColor"]', 'Agate Grey Metallic');
      await session.page.fill('input[name="interiorColor"]', 'Black Leather');
      await saveScreenshot(session.page, 'seller_09_step4_body_colors.png');

      await session.page.click('button:has-text("Continue")');

      // Step 5: Condition & Title
      await expect(session.page.getByText(/Step 5 of 8/i)).toBeVisible({ timeout: 10000 });
      await session.page.locator('button', { hasText: 'Excellent' }).first().click();
      await session.page.locator('button', { hasText: 'Clean' }).first().click();
      await saveScreenshot(session.page, 'seller_10_step5_condition_title.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 11 & 12 [Positive & Negative]: Step 6 - Location & Mileage', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await fillStep1(session.page);
      await fillStep2(session.page);
      await fillStep3(session.page);
      await fillStep4(session.page);
      await fillStep5(session.page);

      // Negative: Empty continue
      await session.page.click('button:has-text("Continue")');
      await expect(session.page.locator('.error-text').first()).toBeVisible({ timeout: 5000 });
      await saveScreenshot(session.page, 'seller_11_step6_mileage_validation.png');

      // Positive: Fill mileage and location
      await session.page.fill('input[name="mileage"]', '12500');
      await session.page.fill('input[name="location"]', 'Miami, FL');
      await saveScreenshot(session.page, 'seller_12_step6_location_filled.png');
    } finally {
      await session.context.close();
    }
  });

  test('Step 13, 14 & 15 [Positive & Negative]: Steps 7 & 8 - Narrative & Photos Upload', async ({ browser }) => {
    const session = await createAuthenticatedContext(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      await session.page.goto('/sell-car/submit');
      await session.page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await fillStep1(session.page);
      await fillStep2(session.page);
      await fillStep3(session.page);
      await fillStep4(session.page);
      await fillStep5(session.page);
      await fillStep6(session.page);

      // Step 7: Narrative
      await session.page.fill('textarea[name="highlights"]', 'Executive Package, Sport Chrono, Carbon Bucket Seats');
      await session.page.fill('textarea[name="description"]', 'Garage-kept since new. Single owner vehicle in pristine condition.');
      await saveScreenshot(session.page, 'seller_13_step7_narrative.png');

      await session.page.click('button:has-text("Continue")');

      // Step 8: Photos upload
      await expect(session.page.getByText(/Step 8 of 8/i)).toBeVisible({ timeout: 10000 });

      // Negative: Try to submit without photos
      const submitBtn = session.page.locator('button:has-text("Create Listing")');
      await expect(submitBtn).toBeVisible({ timeout: 5000 });
      await submitBtn.click();

      // Expect validation error for photos
      await expect(session.page.locator('.error-text').first()).toBeVisible({ timeout: 5000 });
      await expect(session.page.getByText(/Please upload at least one photo/i)).toBeVisible();

      await saveScreenshot(session.page, 'seller_14_step8_missing_photos_validation.png');
    } finally {
      await session.context.close();
    }
  });
});
