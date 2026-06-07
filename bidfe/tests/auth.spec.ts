import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('Login modal appears and validates input', async ({ page }) => {
    // Mock the backend API responses
    await page.route('**/api/v1/auth/login', async route => {
      const json = { message: "Login successful" };
      await route.fulfill({ json });
    });
    
    let isLoggedIn = false;
    await page.route('**/api/v1/users/me', async route => {
      if (isLoggedIn) {
        await route.fulfill({ json: { id: 1, username: "testuser", roles: [{name: "USER"}], email: "test@example.com" } });
      } else {
        await route.fulfill({ status: 401, json: { message: "Unauthorized" } });
      }
    });

    await page.goto('/');
    
    // Click Sign In
    await page.getByRole('link', { name: 'Sign In' }).first().click();
    
    // Expect login modal header
    await expect(page.locator('h2', { hasText: 'Welcome back' })).toBeVisible();

    // Fill credentials
    await page.fill('input[placeholder="Enter your username"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit
    isLoggedIn = true;
    await page.click('button:has-text("Sign in")');

    // Wait for mock login to finish and verify URL/state if it redirects
    // The current form redirects to / upon successful login if not coming from elsewhere
    await page.waitForURL('**/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Registration modal appears and validates input', async ({ page }) => {
    // Mock the register route
    await page.route('**/api/v1/auth/register', async route => {
      const json = { message: "Registration successful. Please check your email to verify your account." };
      await route.fulfill({ json });
    });

    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({ status: 401, json: { message: "Unauthorized" } });
    });

    await page.goto('/');
    
    // Click Sign In, then Sign up
    await page.getByRole('link', { name: 'Sign In' }).first().click();
    await page.click('text=Sign up');

    // Expect register modal header
    await expect(page.locator('h2', { hasText: 'Create an account' })).toBeVisible();

    // Fill credentials
    await page.fill('input[placeholder="Choose a username"]', 'newuser');
    await page.fill('input[placeholder="name@example.com"]', 'newuser@example.com');
    await page.fill('input[placeholder="Create a strong password"]', 'password123');
    
    // Submit
    await page.click('button:has-text("Create account")');

    // Verify success banner appears
    await expect(page.locator('text=Registration successful. Please check your email to verify your account.')).toBeVisible();
  });
});
