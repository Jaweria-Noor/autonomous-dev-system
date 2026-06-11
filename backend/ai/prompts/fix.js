// fix.js
// Prompt used for generating fix suggestions based on error logs

// fix.js
// Prompt used for generating fix suggestions based on error logs

export const fixPrompt = (taskTitle, errorLogs) => `
You are an AI developer assistant. Analyze the Playwright test failure for "${taskTitle}" given the error logs below.
Provide a JSON object where each key is a filename (relative to the generated code root) and each value is the updated file content as a string. Ensure the JSON is literal and can be parsed directly.
Error Logs:
${errorLogs}
`;

