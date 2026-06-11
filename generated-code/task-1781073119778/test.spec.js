import { test, expect } from '@playwright/test';

test('task manager operations', async ({ page }) => {
  // Navigate to task manager
  await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001');

  // Verify elements are visible
  await expect(page.locator('h1')).toHaveText('Task Manager');
  const emptyState = page.locator('#emptyState');
  await expect(emptyState).toBeVisible();

  // Add a task
  const input = page.locator('#taskInput');
  await input.fill('Verify E2E Pipeline');
  await page.click('#addBtn');

  // Verify task was added
  await expect(emptyState).toBeHidden();
  const taskText = page.locator('.task-text');
  await expect(taskText).toHaveText('Verify E2E Pipeline');

  // Complete task
  await taskText.click();
  await expect(page.locator('.task-item')).toHaveClass(/completed/);

  // Delete task
  await page.click('.delete-btn');
  await expect(emptyState).toBeVisible();
});