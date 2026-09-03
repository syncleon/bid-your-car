import { test, expect } from '@playwright/test';

test.describe('Real UI Flow', () => {
  test('should create account and login successfully', async ({ page }) => {
    // Navigate to the app (frontend running on 5173)
    await page.goto('http://localhost:5173');
    
    const uniqueUsername = `testuser_${Date.now()}`;
    const uniqueEmail = `test_${Date.now()}@example.com`;

    // 1. Go to register directly to bypass cookie banners
    await page.goto('http://localhost:5173/register');

    // 2. Fill the Registration Form
    await page.fill('input[placeholder="Choose a username"]', uniqueUsername);
    await page.fill('input[placeholder="name@example.com"]', uniqueEmail);
    await page.fill('input[placeholder="Create a strong password"]', 'password123');
    
    // 3. Submit Registration
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Wait for the success message
    await expect(page.getByText('Account Created')).toBeVisible({ timeout: 5000 });
    
    // 4. Click "Continue to Login"
    await page.click('a:has-text("Continue to Login")');
    
    // 5. Fill the Login Form
    await page.fill('input[placeholder="Enter your username"]', uniqueUsername);
    await page.fill('input[placeholder="••••••••"]', 'password123');
    
    // 6. Submit Login
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // 7. Verify we are logged in by checking the user menu
    const userMenuButton = page.locator('button.user-menu__trigger');
    await expect(userMenuButton).toBeVisible({ timeout: 5000 });
    
    // Check if the dropdown menu is visible
    await userMenuButton.click();
    await expect(page.getByText('My Profile')).toBeVisible();
  });
});
