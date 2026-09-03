import { test, expect } from '@playwright/test';

test.describe('Items API', () => {
  test('should return 401 when fetching private items without token', async ({ request }) => {
    // Usually fetching /items without auth for a specific user might return 401
    const response = await request.get('/api/v1/items');
    
    // Some APIs might allow public listing, but typically /api/v1/items for selling requires auth
    expect([401, 403]).toContain(response.status());
  });

  test('should fail to fetch a non-existent item', async ({ request }) => {
    const response = await request.get('/api/v1/items/invalid-item-id');
    expect([401, 403]).toContain(response.status());
  });
});
