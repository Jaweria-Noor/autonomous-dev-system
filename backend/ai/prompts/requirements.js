// requirements.js
// Prompt used for generating requirements from user input

export const requirementsPrompt = (userPrompt) => `
You are an AI system tasked with converting the following user request into a concise requirements document.
User request: "${userPrompt}"

Provide a list of functional and non‑functional requirements in markdown format.`;
