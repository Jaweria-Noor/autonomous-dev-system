// architecture.js
// Prompt used for generating architecture plan from requirements document

export const architecturePrompt = (requirementsDoc) => `
You are a Senior Software Architect. Create an architecture plan based on these requirements:
"${requirementsDoc}"

Outline the Tech Stack, Components, Database schema if any, and API design in markdown format.`;
