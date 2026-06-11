import { JiraMCP } from '../backend/mcp/mcp-client.js';

(async () => {
  try {
    const epic = await JiraMCP.callTool('create_epic', {
      title: 'Automation Test Epic',
      description: 'Created by automated integration test.'
    });
    console.log('Created Epic:', epic);
    const epicKey = epic.key || JSON.parse(epic).key;
    const story = await JiraMCP.callTool('create_story', {
      title: 'Automation Test Story',
      description: 'Story under test epic.',
      epicId: epicKey
    });
    console.log('Created Story:', story);
  } catch (err) {
    console.error('Error creating Jira items:', err);
  }
})();
