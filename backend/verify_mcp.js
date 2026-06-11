import { JiraMCP, PlaywrightMCP } from './mcp/mcp-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verify() {
  console.log("=== Demonstrating Jira MCP ===");
  try {
    const epic = await JiraMCP.callTool("create_epic", { title: "Test Epic", description: "Epic Desc" });
    console.log("Created Epic:", epic);
    
    const story = await JiraMCP.callTool("create_story", { epicId: epic.id, title: "Test Story", description: "Story Desc" });
    console.log("Created Story:", story);
    
    const bug = await JiraMCP.callTool("create_bug", { storyId: story.id, title: "Test Bug", description: "Bug Desc", traceUrl: "n/a" });
    console.log("Created Bug:", bug);
    
    const dbIssuesPath = path.resolve(__dirname, '../data/jira/issues.json');
    console.log("Local Jira Issues JSON Contents:");
    console.log(fs.readFileSync(dbIssuesPath, 'utf-8'));
  } catch (e) {
    console.error("Jira MCP Error:", e);
  }

  console.log("\\n=== Demonstrating Playwright MCP ===");
  try {
    // We mock a task dir for testing
    const testTaskId = "verification-test";
    const taskDir = path.resolve(__dirname, `../generated-code/task-${testTaskId}`);
    if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });
    
    // Create a dummy test file
    const testFile = path.join(taskDir, 'test.spec.js').replace(/\\/g, '/');
    fs.writeFileSync(testFile, `
import { test, expect } from '@playwright/test';
test('dummy test', async ({ page }) => {
  expect(1).toBe(1);
});
    `);

    console.log("Running Playwright Test via MCP...");
    const result = await PlaywrightMCP.callTool("run_test", { taskId: testTaskId, testFile });
    console.log("Test Result:", result);

    console.log("Capturing Screenshot via MCP...");
    const screenshot = await PlaywrightMCP.callTool("take_screenshot", { taskId: testTaskId });
    console.log("Screenshot:", screenshot);

  } catch (e) {
    console.error("Playwright MCP Error:", e);
  }
  
  process.exit(0);
}

verify();
