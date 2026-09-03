import { test, expect } from '@playwright/test';

test.describe.serial('Auth API', () => {
  const uniqueUsername = `testuser_${Date.now()}`;
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const password = 'password123';

  test('should register a new user successfully', async ({ request }) => {
    const response = await request.post('/api/v1/auth/register', {
      data: {
        username: uniqueUsername,
        email: uniqueEmail,
        password: password,
      }
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should login the newly registered user', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        username: uniqueUsername,
        password: password,
      }
    });

    if (!response.ok()) {
      console.error(await response.text());
    }
    expect(response.ok()).toBeTruthy();
    
    // Check if we can fetch the profile with the cookie
    const profileResponse = await request.get('/api/v1/users/me');
    expect(profileResponse.ok()).toBeTruthy();
    const profile = await profileResponse.json();
    expect(profile.username).toBe(uniqueUsername);
  });

  test('should fail to login with wrong password', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        username: uniqueUsername,
        password: 'wrongpassword',
      }
    });

    // We expect 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });
});
