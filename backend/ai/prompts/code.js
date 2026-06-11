// code.js
// Prompt used for generating code files and playwright test file.

export const codePrompt = (taskTitle, description, attempt, errorLogs) => `
You are a Senior Software Developer. Generate the source files and a Playwright test file for:
Title: "${taskTitle}"
Description: "${description}"

${attempt > 0 ? `This is attempt #${attempt}. The previous run failed with errors:
${errorLogs}
Please analyze the failures and fix the code.` : ''}

You MUST return a JSON object mapping filenames to their file contents.
The files must include:
1. An "index.html" that serves as the UI (styled with inline CSS/Vanilla CSS, modern and high-quality).
2. A "server.js" if needed, or simply static frontend files.
3. A "test.spec.js" containing Playwright tests to verify the core requirements. The test should navigate to the page and verify key functionality.

Output format must be a raw JSON object with NO markdown wrapping or backticks.
All file contents MUST be Base64-encoded to ensure correct transmission of special characters.
The JSON structure should be:
{
  "index.html": "Base64_STRING",
  "test.spec.js": "Base64_STRING"
}
Ensure it is valid JSON.`;
