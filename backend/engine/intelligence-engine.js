// backend/engine/intelligence-engine.js
// Orchestrates AI generation directly via Gemini REST API without any fallbacks.

import fetch from 'node-fetch';
import { requirementsPrompt } from '../ai/prompts/requirements.js';
import { architecturePrompt } from '../ai/prompts/architecture.js';
import { userStoriesPrompt } from '../ai/prompts/user_stories.js';
import { codePrompt } from '../ai/prompts/code.js';
import { fixPrompt } from '../ai/prompts/fix.js';

const MODEL_NAME = 'gemini-2.5-flash';
const ENDPOINT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// Startup diagnostic log & test function
export async function initGeminiDiagnostics() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('--- Gemini AI Diagnostics ---');
  console.log(`API key loaded: ${!!apiKey}`);
  console.log(`Endpoint URL: ${ENDPOINT_URL}`);
  console.log(`Model name: ${MODEL_NAME}`);
  
  if (apiKey) {
    try {
      console.log('Sending test request: "Hello Gemini"...');
      const testUrl = `${ENDPOINT_URL}?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: "Hello Gemini" }] }] };
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Test failed with status: ${response.status} - ${await response.text()}`);
      }
      
      const data = await response.json();
      console.log(`Test Response: ${data.candidates[0].content.parts[0].text}`);
    } catch (err) {
      console.error('Test Error:', err.message);
    }
  }
  console.log('-----------------------------');
}

// Shared Gemini REST API execution wrapper
async function callGemini(stepName, prompt, retries = 6) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(`[AI] ${stepName}: GEMINI_API_KEY is missing in .env. Pipeline STOPPED.`);
  }

  const url = `${ENDPOINT_URL}?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503 || response.status === 429) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 3000;
            console.warn(`[AI] ${stepName}: API returned ${response.status} (High demand/Rate limit). Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            continue;
          }
        }
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("Gemini API returned no candidates.");
      }

      console.log(`[AI] ${stepName}: Gemini response received successfully.`);
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      if (attempt < retries && (err.message.includes('503') || err.message.includes('429') || err.type === 'system')) {
        const delay = Math.pow(2, attempt) * 3000;
        console.warn(`[AI] ${stepName} network error. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      console.error(`[AI] ${stepName} Failed:`, err.message);
      throw err; // Fail-fast: throw error to stop pipeline
    }
  }
}

export const AIService = {
  generateRequirements: async (title, description) => {
    const prompt = requirementsPrompt(`${title}\n${description}`);
    return await callGemini('Requirements Generation', prompt);
  },

  generateArchitecturePlan: async (requirements) => {
    const prompt = architecturePrompt(requirements);
    return await callGemini('Architecture Planning', prompt);
  },

  generateUserStories: async (title, description) => {
    const prompt = userStoriesPrompt(title, description);
    const resultStr = await callGemini('User Stories Generation', prompt);

    try {
      // Parse user stories from JSON
      const cleanJson = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error('[AI] User Stories parsing error:', err.message);
      throw new Error(`Failed to parse User Stories JSON from Gemini: ${err.message}`);
    }
  },

  generateCode: async (title, description, previewUrl, attempt = 0, errorLogs = '') => {
    const prompt = codePrompt(title, description, attempt, errorLogs);
    const resultStr = await callGemini('Code Generation', prompt);

    try {
      const cleanJson = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      const files = {};
      for (const [filename, content] of Object.entries(parsed)) {
        files[filename] = content.replace(/{PREVIEW_URL}/g, previewUrl);
      }
      return { files };
    } catch (err) {
      console.error('[AI] Code JSON parsing error:', err.message);
      throw new Error(`Failed to parse Code JSON from Gemini: ${err.message}`);
    }
  },

  generateFix: async (taskTitle, errorLogs) => {
    const prompt = fixPrompt(taskTitle, errorLogs);
    const resultStr = await callGemini('Fix Generation', prompt);
    try {
      const cleanJson = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      // Expect the AI to return a mapping of filename -> file content
      return { files: parsed };
    } catch (err) {
      console.error('[AI] Fix JSON parsing error:', err.message);
      throw new Error(`Failed to parse Fix JSON from Gemini: ${err.message}`);
    }
  }
};
