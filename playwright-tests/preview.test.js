import { test, expect } from '@playwright/test';

// Fallback preview test – ensures placeholder page is served when the task does not exist
test('Preview fallback returns placeholder page', async ({ page }) => {
  // Navigate to a non‑existent preview URL
  await page.goto('http://localhost:3001/preview/nonexistent-task/index.html');

  // Expect the placeholder HTML to be loaded (status 200)
  await expect(page).toHaveURL(/\/preview\/nonexistent-task\/index.html/);
  await expect(page).toHaveTitle(/Preview Unavailable/); // title from placeholder

  // Verify the cyber‑punk placeholder message is present
  const placeholderHeader = page.locator('h1');
  await expect(placeholderHeader).toContainText('Preview not available – fallback mode active');
});

// Optional API sanity test – checks /api/tasks returns a JSON array
test('GET /api/tasks returns JSON array', async ({ request }) => {
  const response = await request.get('http://localhost:3001/api/tasks');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});
