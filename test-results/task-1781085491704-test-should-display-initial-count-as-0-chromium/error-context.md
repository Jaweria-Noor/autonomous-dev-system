# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-1781085491704\test.spec.js >> should display initial count as 0
- Location: generated-code\task-1781085491704\test.spec.js:54:1

# Error details

```
"beforeAll" hook timeout of 10000ms exceeded.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { exec } from 'child_process';
  3  | import { promisify } from 'util';
  4  | 
  5  | const execAsync = promisify(exec);
  6  | let serverProcess;
  7  | const PORT = 3000;
  8  | const BASE_URL = `http://localhost:${PORT}`;
  9  | 
> 10 | test.beforeAll(async () => {
     |      ^ "beforeAll" hook timeout of 10000ms exceeded.
  11 |   // Ensure express is installed, as it's required by server.js.
  12 |   // In a real project, 'express' would be a dependency in package.json
  13 |   // and installed via 'npm install' before running tests.
  14 |   try {
  15 |     console.log('Checking for express installation...');
  16 |     // This will install if not present, or do nothing if already present.
  17 |     // We silence the output as it can be noisy.
  18 |     await execAsync('npm install express --silent', { stdio: 'pipe' });
  19 |     console.log('Express is installed.');
  20 |   } catch (error) {
  21 |     console.error('Failed to ensure express installation. Please ensure Node.js and npm are installed and try running `npm install express` manually.', error.message);
  22 |     process.exit(1); // Exit if essential dependency cannot be met
  23 |   }
  24 | 
  25 |   // Start the server
  26 |   console.log(`Starting server on port ${PORT}...`);
  27 |   serverProcess = exec(`node server.js`);
  28 | 
  29 |   // Log server output for debugging (optional, uncomment if needed)
  30 |   // serverProcess.stdout.on('data', (data) => {
  31 |   //   console.log(`Server stdout: ${data.trim()}`);
  32 |   // });
  33 |   // serverProcess.stderr.on('data', (data) => {
  34 |   //   console.error(`Server stderr: ${data.trim()}`);
  35 |   // });
  36 | 
  37 |   // Wait for the server to be ready
  38 |   await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time for server startup robustness
  39 |   console.log('Server likely started. Proceeding with tests.');
  40 | });
  41 | 
  42 | test.afterAll(async () => {
  43 |   if (serverProcess) {
  44 |     serverProcess.kill(); // Terminate the server process
  45 |     console.log('Server process killed.');
  46 |   }
  47 | });
  48 | 
  49 | test.beforeEach(async ({ page }) => {
  50 |   // Navigate to the base URL before each test
  51 |   await page.goto(BASE_URL);
  52 | });
  53 | 
  54 | test('should display initial count as 0', async ({ page }) => {
  55 |   const counter = page.locator('#counter');
  56 |   await expect(counter).toHaveText('0');
  57 | });
  58 | 
  59 | test('should increment count on button click', async ({ page }) => {
  60 |   const incrementButton = page.locator('#incrementButton');
  61 |   const counter = page.locator('#counter');
  62 | 
  63 |   await incrementButton.click();
  64 |   await expect(counter).toHaveText('1');
  65 | });
  66 | 
  67 | test('should increment count multiple times', async ({ page }) => {
  68 |   const incrementButton = page.locator('#incrementButton');
  69 |   const counter = page.locator('#counter');
  70 | 
  71 |   await incrementButton.click();
  72 |   await incrementButton.click();
  73 |   await incrementButton.click();
  74 | 
  75 |   await expect(counter).toHaveText('3');
  76 | });
  77 | 
```