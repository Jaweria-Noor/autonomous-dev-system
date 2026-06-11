import { test, expect } from '@playwright/test';

test.describe('Todo Application', () => {
    // Set a base URL for all tests in this describe block
    // This ensures Playwright knows where to find the server.
    test.use({ baseURL: 'http://localhost:3000' });

    test.beforeEach(async ({ page }) => {
        // Navigate to the root URL (which will serve index.html)
        await page.goto('/'); 
    });

    test('should display the application title', async ({ page }) => {
        await expect(page).toHaveTitle('Todo Application');
        await expect(page.locator('h1')).toHaveText('Todo Application');
    });

    test('should allow adding a new todo item and clear the input', async ({ page }) => {
        const todoText = 'Learn Playwright';

        await page.fill('#todoInput', todoText);
        await page.click('#addBtn');

        // Expect the input to be cleared
        await expect(page.locator('#todoInput')).toHaveValue('');

        // Expect the new item to be in the list
        await expect(page.locator('#todoList li')).toHaveCount(1);
        await expect(page.locator('#todoList li span')).toHaveText(todoText);
    });

    test('should allow adding multiple todo items and clear input each time', async ({ page }) => {
        const todo1 = 'Buy groceries';
        const todo2 = 'Walk the dog';
        const todo3 = 'Read a book';

        await page.fill('#todoInput', todo1);
        await page.click('#addBtn');
        await expect(page.locator('#todoInput')).toHaveValue('');
        await expect(page.locator('#todoList li').nth(0)).toContainText(todo1);

        await page.fill('#todoInput', todo2);
        await page.click('#addBtn');
        await expect(page.locator('#todoInput')).toHaveValue('');
        await expect(page.locator('#todoList li').nth(1)).toContainText(todo2);

        await page.fill('#todoInput', todo3);
        await page.click('#addBtn');
        await expect(page.locator('#todoInput')).toHaveValue('');
        await expect(page.locator('#todoList li').nth(2)).toContainText(todo3);

        await expect(page.locator('#todoList li')).toHaveCount(3);
    });

    test('should not add an empty todo item and show an alert', async ({ page }) => {
        // Listen for alert dialogs
        page.on('dialog', async dialog => {
            expect(dialog.type()).toBe('alert');
            expect(dialog.message()).toBe('Please enter a task!');
            await dialog.accept(); // Close the alert
        });

        await page.fill('#todoInput', '   '); // Enter only whitespace
        await page.click('#addBtn');

        // Expect no items to be added to the list
        await expect(page.locator('#todoList li')).toHaveCount(0);
        // Expect the input not to be cleared if it was just whitespace and nothing was added
        // (The current JS clears it only after successful add, so it should retain the whitespace)
        // However, the JS implementation now clears it IF a task is added. If not, it keeps the input.
        // If an alert is shown, the input should *not* be cleared by the add logic.
        await expect(page.locator('#todoInput')).toHaveValue('   '); 
        
        // Try with genuinely empty string
        await page.fill('#todoInput', '');
        await page.click('#addBtn');
        await expect(page.locator('#todoList li')).toHaveCount(0);
        await expect(page.locator('#todoInput')).toHaveValue('');
    });

    test('should allow deleting a todo item', async ({ page }) => {
        const todoText = 'Task to delete';

        // Add an item first
        await page.fill('#todoInput', todoText);
        await page.click('#addBtn');
        await expect(page.locator('#todoList li')).toHaveCount(1);

        // Click the delete button for the added item
        await page.click('#todoList li .delete-btn');

        // Expect the item to be removed from the list
        await expect(page.locator('#todoList li')).toHaveCount(0);
    });
});
