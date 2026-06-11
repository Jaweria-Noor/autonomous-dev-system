import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let serverProcess;
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

test.beforeAll(async () => {
  // Ensure express is installed, as it's required by server.js.
  // In a real project, 'express' would be a dependency in package.json
  // and installed via 'npm install' before running tests.
  try {
    console.log('Checking for express installation...');
    // This will install if not present, or do nothing if already present.
    // We silence the output as it can be noisy.
    await execAsync('npm install express --silent', { stdio: 'pipe' });
    console.log('Express is installed.');
  } catch (error) {
    console.error('Failed to ensure express installation. Please ensure Node.js and npm are installed and try running `npm install express` manually.', error.message);
    process.exit(1); // Exit if essential dependency cannot be met
  }

  // Start the server
  console.log(`Starting server on port ${PORT}...`);
  serverProcess = exec(`node server.js`);

  // Log server output for debugging (optional, uncomment if needed)
  // serverProcess.stdout.on('data', (data) => {
  //   console.log(`Server stdout: ${data.trim()}`);
  // });
  // serverProcess.stderr.on('data', (data) => {
  //   console.error(`Server stderr: ${data.trim()}`);
  // });

  // Wait for the server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time for server startup robustness
  console.log('Server likely started. Proceeding with tests.');
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill(); // Terminate the server process
    console.log('Server process killed.');
  }
});

test.beforeEach(async ({ page }) => {
  // Navigate to the base URL before each test
  await page.goto(BASE_URL);
});

test('should display initial count as 0', async ({ page }) => {
  const counter = page.locator('#counter');
  await expect(counter).toHaveText('0');
});

test('should increment count on button click', async ({ page }) => {
  const incrementButton = page.locator('#incrementButton');
  const counter = page.locator('#counter');

  await incrementButton.click();
  await expect(counter).toHaveText('1');
});

test('should increment count multiple times', async ({ page }) => {
  const incrementButton = page.locator('#incrementButton');
  const counter = page.locator('#counter');

  await incrementButton.click();
  await incrementButton.click();
  await incrementButton.click();

  await expect(counter).toHaveText('3');
});
