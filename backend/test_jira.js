import { JiraMCP } from './mcp/mcp-client.js';
(async () => {
  try {
    const res = await JiraMCP.callTool('create_epic', { title: 'Test Epic', description: 'Epic for testing' });
    console.log('Epic created:', res);
    // Attempt duplicate creation to test cache
    const res2 = await JiraMCP.callTool('create_epic', { title: 'Test Epic', description: 'Epic for testing' });
    console.log('Duplicate epic response (should be cached):', res2);
  } catch (e) {
    console.error('Error:', e);
  }
})();
