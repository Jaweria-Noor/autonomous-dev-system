import { test, expect } from '@playwright/test';

test('login form validation test', async ({ page }) => {
    // Navigate to local preview page
    await page.goto('http://localhost:3001/preview/task-6a0ffd05db978337752e861e/index.html');
    
    // Fill invalid email
    await page.fill('#emailInput', 'invalid-email');
    await page.fill('#passwordInput', '12345');
    
    // Click submit
    await page.click('#submitBtn');
    
    // The test expects validation errors to show up because email is not valid
    const emailError = page.locator('#emailError');
    await expect(emailError).toBeVisible();
    
    // Password is less than 6 chars, password error must show
    const passwordError = page.locator('#passwordError');
    await expect(passwordError).toBeVisible();

    // Now fill valid data
    await page.fill('#emailInput', 'valid@company.com');
    await page.fill('#passwordInput', 'secret123');

    // Click submit
    await page.click('#submitBtn');

    // Verify errors are hidden
    await expect(emailError).toBeHidden();
    await expect(passwordError).toBeHidden();
});