import { JiraMCP, PlaywrightMCP } from './backend/mcp/mcp-client.js';
(async () => {
  try {
    const jiraTools = await JiraMCP.listTools();
    console.log('Jira Tools:', jiraTools);
  } catch (e) {
    console.error('Jira error:', e.message);
  }
  try {
    const pwTools = await PlaywrightMCP.listTools();
    console.log('Playwright Tools:', pwTools);
  } catch (e) {
    console.error('Playwright error:', e.message);
  }
})();
