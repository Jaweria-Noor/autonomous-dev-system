import { JiraMCP } from "./mcp-client.js";

async function main() {
  try {
    const epic = await JiraMCP.callTool('create_epic', {
      title: 'Demo Epic (Automated)',
      description: 'Epic created by autonomous system for verification.'
    });
    console.log('Epic created:', JSON.stringify(epic));

    const epicKey = epic.key || epic.id;
    const story = await JiraMCP.callTool('create_story', {
      epicId: epicKey,
      title: 'Demo Story (Automated)',
      description: 'Story linked to the demo epic.'
    });
    console.log('Story created:', JSON.stringify(story));
  } catch (err) {
    console.error('Error during Jira creation:', err);
  }
}

main();
