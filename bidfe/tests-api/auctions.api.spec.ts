import { test, expect } from '@playwright/test';

test.describe('Auctions API', () => {
  test('should fetch paginated active auctions', async ({ request }) => {
    const response = await request.get('/api/v1/auctions?status=ACTIVE&page=0&size=10');
    
    // We expect the endpoint to exist and return a valid page structure
    // (even if empty, it should be 200)
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.content).toBeDefined();
    expect(Array.isArray(body.content)).toBeTruthy();
    expect(typeof body.totalElements).toBe('number');
  });

  test('should fail to fetch a non-existent auction', async ({ request }) => {
    const response = await request.get('/api/v1/auctions/123e4567-e89b-12d3-a456-426614174000');
    expect(response.status()).toBe(404);
  });
});
