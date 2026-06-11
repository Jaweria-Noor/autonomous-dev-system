// user_stories.js
// Prompt used for generating user stories and epic from task description

export const userStoriesPrompt = (userPrompt, description) => `
You are a Product Owner. Generate a Jira Epic and standard User Stories for:
Title: "${userPrompt}"
Description: "${description}"

Output must be in JSON format matching exactly:
{
  "epic": { "title": "Epic Title", "description": "Epic Description" },
  "stories": [
    { "title": "Story 1", "description": "As a... I want to... So that..." },
    { "title": "Story 2", "description": "As a... I want to... So that..." }
  ]
}
Return only JSON. Do not include markdown code block formatting or backticks.`;
