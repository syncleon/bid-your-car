import { test, expect, Browser } from '@playwright/test';
import { createScreenshotSaver } from './helpers/screenshot';

const saveScreenshot = createScreenshotSaver('edit_item');

async function loginUser(browser: Browser, user: { username: string; password: string }, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const loginRes = await context.request.post('http://localhost:8080/api/v1/auth/login', {
    data: { username: user.username, password: user.password },
  });

  expect(loginRes.ok()).toBeTruthy();
  const data = await loginRes.json();
  const token = data.token;

  await context.addInitScript((authToken) => {
    localStorage.setItem('auth_token', authToken);
  }, token);

  const page = await context.newPage();
  return { context, page, token };
}

test.describe('Edit Item Page & Endpoint (/items/:id/edit)', () => {

  test('Step 1 [Security]: Unauthenticated access to /items/:id/edit redirects to login', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto('/items/6541d9e6-365a-4bb2-8182-5b4366ac0d24/edit');
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});

      await expect(page).toHaveURL(/.*login\?redirect=%2Fitems%2F6541d9e6-365a-4bb2-8182-5b4366ac0d24%2Fedit/);
      await saveScreenshot(page, 'edit_item_01_unauthenticated_guard.png');
    } finally {
      await context.close();
    }
  });

  test('Step 2 [API]: GET /api/v1/items/:id/edit returns item details for editing', async ({ browser }) => {
    const { context, token } = await loginUser(browser, {
      username: 'seller_john',
      password: 'password123',
    });

    try {
      // 1. Fetch seller's items to find or create a draft item
      const meRes = await context.request.get('http://localhost:8080/api/v1/items/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(meRes.ok()).toBeTruthy();
      const meData = await meRes.json();

      let testItem = meData.content?.find((i: { status?: string }) => i.status === 'DRAFT' || i.status === 'UNSOLD');

      if (!testItem) {
        // Create a draft vehicle listing
        const uniqueVin = `1HGCR2F8${Math.floor(100000000 + Math.random() * 900000000)}`.substring(0, 17);
        const createRes = await context.request.post('http://localhost:8080/api/v1/items', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            year: 2022,
            make: 'Porsche',
            model: '911 GT3 Touring',
            vin: uniqueVin,
            location: 'Austin, TX',
            mileage: 4200,
            description: 'Flawless GT3 Touring in Agate Grey.',
            fuelType: 'Gasoline',
            horsepower: 502,
            condition: 'EXCELLENT',
            titleStatus: 'Clean',
            engine: '4.0L Naturally Aspirated Boxer-6',
            drivetrain: 'RWD',
            transmission: 'Manual',
            bodyStyle: 'Coupe',
            exteriorColor: 'Agate Grey Metallic',
            interiorColor: 'Black Leather / Fabric',
            hasServiceHistory: true,
            isModified: false,
            highlights: 'Chrono package, carbon bucket seats, front axle lift system',
            knownFlaws: 'None. Paint protection film applied over entire front clip.',
            recentServiceHistory: 'Annual service completed at Porsche Austin in August 2024.',
            otherItemsIncluded: '2 keys, window sticker, indoor car cover, battery maintainer'
          }
        });
        expect(createRes.ok()).toBeTruthy();
        testItem = await createRes.json();
      }

      // Test the dedicated GET /api/v1/items/{id}/edit endpoint
      const editEndpointRes = await context.request.get(`http://localhost:8080/api/v1/items/${testItem.id}/edit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(editEndpointRes.ok()).toBeTruthy();
      const editData = await editEndpointRes.json();
      expect(editData.id).toBe(testItem.id);
      expect(editData.vin).toBe(testItem.vin);
      expect(editData.make).toBe(testItem.make);
      console.log('✅ GET /api/v1/items/{id}/edit verified successfully:', editData.id);
    } finally {
      await context.close();
    }
  });

  test('Step 3 [UI Desktop & Mobile]: Edit Item page renders and updates vehicle specifications', async ({ browser }) => {
    const { context, page, token } = await loginUser(browser, {
      username: 'seller_john',
      password: 'password123',
    }, { width: 1440, height: 900 });

    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));

    try {
      // 1. Get or create draft item
      const meRes = await context.request.get('http://localhost:8080/api/v1/items/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();
      let testItem = meData.content?.find((i: { status?: string }) => i.status === 'DRAFT' || i.status === 'UNSOLD');

      if (!testItem) {
        const uniqueVin = `2HGCR2F8${Math.floor(100000000 + Math.random() * 900000000)}`.substring(0, 17);
        const createRes = await context.request.post('http://localhost:8080/api/v1/items', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            year: 2021,
            make: 'BMW',
            model: 'M3 Competition',
            vin: uniqueVin,
            location: 'Miami, FL',
            mileage: 18500,
            description: 'Immaculate Isle of Man Green M3 Competition.',
            fuelType: 'Gasoline',
            horsepower: 503,
            condition: 'VERY_GOOD',
            titleStatus: 'Clean',
            engine: '3.0L Twin-Turbo S58 Inline-6',
            drivetrain: 'RWD',
            transmission: 'Automatic',
            bodyStyle: 'Sedan',
            exteriorColor: 'Isle of Man Green',
            interiorColor: 'Kyalami Orange',
            hasServiceHistory: true,
            isModified: false,
            highlights: 'Carbon fiber roof, Executive Package, Harman Kardon surround audio',
            knownFlaws: 'Minor stone chip on lower front lip',
            recentServiceHistory: 'Oil service & brake fluid flush at 15,000 miles',
            otherItemsIncluded: 'Both master keys, factory manuals, window sticker'
          }
        });
        testItem = await createRes.json();
      }

      // Navigate to /items/:id
      await page.goto(`/items/${testItem.id}`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // Verify "Edit Details & Specs" button exists and click it
      const editBtn = page.getByRole('button', { name: /Edit Details & Specs/i });
      await expect(editBtn).toBeVisible({ timeout: 10000 });
      await editBtn.click();

      // Verify navigation to /items/:id/edit
      await expect(page).toHaveURL(new RegExp(`/items/${testItem.id}/edit`));

      // Wait for edit page elements
      await expect(page.locator('.edit-page-title')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.edit-vin-badge')).toContainText(testItem.vin);

      // Capture desktop screenshots
      await saveScreenshot(page, 'edit_item_02_desktop_viewport.png');
      await saveScreenshot(page, 'edit_item_02_desktop_fullpage.png', { fullPage: true });

      // Modify form fields
      const newMileage = 19200;
      const newHorsepower = 510;
      const newHighlights = 'M Carbon bucket seats, Executive Package, ceramic tint, Harman Kardon audio';
      const newFlaws = 'Minor stone chip on lower front lip (touched up)';

      await page.locator('input[name="mileage"]').fill(newMileage.toString());
      await page.locator('input[name="horsepower"]').fill(newHorsepower.toString());
      await page.locator('textarea[name="highlights"]').fill(newHighlights);
      await page.locator('textarea[name="knownFlaws"]').fill(newFlaws);

      // Click condition chip "EXCELLENT"
      const excellentChip = page.locator('.edit-condition-chip:has-text("Excellent")');
      if (await excellentChip.isVisible()) {
        await excellentChip.click();
      }

      // Save changes
      const saveBtn = page.locator('button.edit-btn-save');
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      // Verify redirect back to /items/:id
      await expect(page).toHaveURL(new RegExp(`/items/${testItem.id}$`), { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Verify updated details appear on page
      await expect(page.getByText('19,200 miles').first()).toBeVisible({ timeout: 5000 });
      await saveScreenshot(page, 'edit_item_03_saved_redirect.png', { fullPage: true });

    } finally {
      await context.close();
    }
  });

  test('Step 4 [Mobile Responsive]: Edit Item page on mobile viewport (390x844)', async ({ browser }) => {
    const { context, page, token } = await loginUser(browser, {
      username: 'seller_john',
      password: 'password123',
    }, { width: 390, height: 844 });

    try {
      const meRes = await context.request.get('http://localhost:8080/api/v1/items/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();
      const testItem = meData.content?.find((i: { status?: string; id?: string }) => i.status === 'DRAFT' || i.status === 'UNSOLD') || meData.content?.[0];

      if (testItem) {
        await page.goto(`/items/${testItem.id}/edit`);
        await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(1000);

        await expect(page.locator('.edit-page-title')).toBeVisible({ timeout: 10000 });
        await saveScreenshot(page, 'edit_item_04_mobile_viewport.png');
        await saveScreenshot(page, 'edit_item_05_mobile_fullpage.png', { fullPage: true });
      }
    } finally {
      await context.close();
    }
  });

  test('Step 5 [Photo Management]: Changing main image via Make Main button, reorder arrows, and drag-and-drop', async ({ browser }) => {
    const { context, page, token } = await loginUser(browser, {
      username: 'seller_john',
      password: 'password123',
    }, { width: 1440, height: 900 });

    try {
      // 1. Create a dedicated draft vehicle for photo testing
      const uniqueVin = `3HGCR2F8${Math.floor(100000000 + Math.random() * 900000000)}`.substring(0, 17);
      const createRes = await context.request.post('http://localhost:8080/api/v1/items', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          year: 2023,
          make: 'Audi',
          model: 'RS6 Avant',
          vin: uniqueVin,
          location: 'Chicago, IL',
          mileage: 6500,
          description: 'Nardo Grey RS6 Avant with Dynamic Package Plus.',
          fuelType: 'Gasoline',
          horsepower: 591,
          condition: 'EXCELLENT',
          titleStatus: 'Clean',
          engine: '4.0L Twin-Turbo V8',
          drivetrain: 'AWD',
          transmission: 'Automatic',
          bodyStyle: 'Wagon',
          exteriorColor: 'Nardo Grey',
          interiorColor: 'Black Valcona Leather',
          hasServiceHistory: true,
          isModified: false,
          highlights: 'Carbon optic package, Bang & Olufsen 3D sound, ceramic brakes',
          knownFlaws: 'None',
          recentServiceHistory: 'Fresh 5k mile service performed at Audi Exchange',
          otherItemsIncluded: 'Both master keys, Monroney label, OEM cargo liner'
        }
      });
      expect(createRes.ok()).toBeTruthy();
      const item = await createRes.json();

      // 2. Upload 3 distinct dummy images
      const dummyPng1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      const dummyPng2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
      const dummyPng3 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==', 'base64');

      const img1Res = await context.request.post(`http://localhost:8080/api/v1/items/${item.id}/images?category=MAIN`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: { name: 'nardo_front_main.png', mimeType: 'image/png', buffer: dummyPng1 }
        }
      });
      expect(img1Res.ok()).toBeTruthy();
      await img1Res.json();

      const img2Res = await context.request.post(`http://localhost:8080/api/v1/items/${item.id}/images?category=EXTERIOR`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: { name: 'nardo_rear_quarter.png', mimeType: 'image/png', buffer: dummyPng2 }
        }
      });
      expect(img2Res.ok()).toBeTruthy();
      const img2 = await img2Res.json();

      const img3Res = await context.request.post(`http://localhost:8080/api/v1/items/${item.id}/images?category=INTERIOR`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: { name: 'nardo_cockpit.png', mimeType: 'image/png', buffer: dummyPng3 }
        }
      });
      expect(img3Res.ok()).toBeTruthy();
      await img3Res.json();

      // 3. Navigate to Edit Details & Specs page
      await page.goto(`/items/${item.id}/edit`);
      await page.click('button:has-text("Accept Cookies")', { timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // Verify 3 existing images rendered in gallery
      const existingCards = page.locator('.gallery-grid .gallery-item');
      await expect(existingCards).toHaveCount(3);

      // Verify card 0 is currently Main Cover
      await expect(page.locator('[data-testid="existing-image-0"] .main-cover-badge')).toBeVisible();
      await expect(page.locator('[data-testid="existing-image-0"] .main-cover-badge')).toContainText('Main Cover');
      await expect(page.locator('[data-testid="existing-image-0"]')).toHaveClass(/is-main/);

      // Take screenshot of initial state
      await saveScreenshot(page, 'edit_item_06_initial_gallery.png');

      // 4. Test "Make Main" button on image #1 (the 2nd photo, nardo_rear_quarter)
      const makeMainBtn = page.locator('[data-testid="make-main-existing-1"]');
      await expect(makeMainBtn).toBeVisible();
      await makeMainBtn.click();
      await page.waitForTimeout(300);

      // Verify that after clicking "Make Main", card 0 is now the previous 2nd image (img2)
      await expect(page.locator('[data-testid="existing-image-0"] .main-cover-badge')).toBeVisible();
      const currentMainImgSrc = await page.locator('[data-testid="existing-image-0"] img').getAttribute('src');
      expect(currentMainImgSrc).toBe(img2.url);

      // Take screenshot after "Make Main" click
      await saveScreenshot(page, 'edit_item_07_after_make_main_click.png');

      // 5. Test arrow controls: Move photo at index 1 to the right (to index 2)
      const moveRightBtn = page.locator('[data-testid="move-right-existing-1"]');
      if (await moveRightBtn.isVisible()) {
        await moveRightBtn.click();
        await page.waitForTimeout(300);
      }

      // 6. Test HTML5 Drag & Drop: Drag image at index 2 back to index 0
      const card2 = page.locator('[data-testid="existing-image-2"]');
      const card0 = page.locator('[data-testid="existing-image-0"]');
      await card2.dragTo(card0);
      await page.waitForTimeout(300);

      // Take screenshot of gallery after drag-and-drop
      await saveScreenshot(page, 'edit_item_08_after_drag_and_drop.png');

      // 7. Click Save Changes
      const saveBtn = page.locator('button.edit-btn-save');
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      // 8. Verify redirection to /items/:id
      await expect(page).toHaveURL(new RegExp(`/items/${item.id}$`), { timeout: 10000 });
      await page.waitForTimeout(1000);

      // 9. Verify on the backend via API that the item's thumbnailUrl was updated to the new main image
      const refreshedItemRes = await context.request.get(`http://localhost:8080/api/v1/items/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(refreshedItemRes.ok()).toBeTruthy();
      const refreshedItem = await refreshedItemRes.json();
      expect(refreshedItem.images[0].category).toBe('MAIN');
      expect(refreshedItem.images[0].sortOrder).toBe(0);
      expect(refreshedItem.thumbnailUrl).toBe(refreshedItem.images[0].url);
      console.log('✅ Main cover updated and verified! thumbnailUrl:', refreshedItem.thumbnailUrl);

      // 10. Screenshot of item details page showing updated cover image
      await saveScreenshot(page, 'edit_item_09_vehicle_details_updated_main.png');

    } finally {
      await context.close();
    }
  });
});
