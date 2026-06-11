// backend/ai/gemini-provider.js
// Gemini API integration with reliability controls.

import fetch from 'node-fetch';
import { requirementsPrompt } from './prompts/requirements.js';
import { architecturePrompt } from './prompts/architecture.js';
import { userStoriesPrompt } from './prompts/user_stories.js';
import { codePrompt } from './prompts/code.js';
import { fixPrompt } from './prompts/fix.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Helper function to call Gemini with robust error handling and timeout
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    console.warn('[AI] GEMINI_API_KEY not configured. Skipping Gemini call.');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.warn('[AI] Gemini API returned 429 (Quota Exceeded).');
      return null;
    }

    if (!response.ok) {
      console.error(`[AI] Gemini API returned non-2xx status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error('[AI] Gemini API request timed out after 30 seconds.');
    } else {
      console.error('[AI] Gemini request failed:', err.message || err);
    }
    return null;
  }
}

export async function askGeminiRequirements(userPrompt) {
  const prompt = requirementsPrompt(userPrompt);
  return await callGemini(prompt);
}

export async function askGeminiArchitecturePlan(requirementsDoc) {
  const prompt = architecturePrompt(requirementsDoc);
  return await callGemini(prompt);
}

export async function askGeminiUserStories(userPrompt, description) {
  const prompt = userStoriesPrompt(userPrompt, description);
  return await callGemini(prompt);
}

export async function askGeminiCode(taskTitle, description, previewUrl, attempt, errorLogs) {
  const prompt = codePrompt(taskTitle, description, attempt, errorLogs);
  return await callGemini(prompt);
}

export async function askGeminiFix(taskTitle, errorLogs) {
  const prompt = fixPrompt(taskTitle, errorLogs);
  return await callGemini(prompt);
}
