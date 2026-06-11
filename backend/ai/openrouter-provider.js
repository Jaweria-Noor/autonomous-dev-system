// backend/ai/openrouter-provider.js
// OpenRouter API integration with fallback and retries.

import fetch from 'node-fetch';
import { requirementsPrompt } from './prompts/requirements.js';
import { architecturePrompt } from './prompts/architecture.js';
import { userStoriesPrompt } from './prompts/user_stories.js';
import { codePrompt } from './prompts/code.js';
import { fixPrompt } from './prompts/fix.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
const OPENROUTER_ENDPOINT = `https://openrouter.ai/api/v1/chat/completions`;

/** Helper to call OpenRouter with timeout and retry */
async function callOpenRouter(prompt, retries = 2) {
  if (!OPENROUTER_API_KEY) {
    console.warn('[AI] OPENROUTER_API_KEY not set – skipping OpenRouter call');
    return null;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const body = {
    model: OPENROUTER_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 1024,
    stream: false,
  };
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://github.com/yourrepo/AutonomousDev',
    'X-Title': 'AutonomousDev SDLC',
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        return text || null;
      }
      if (response.status === 429) {
        // exponential backoff
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      console.error(`[AI] OpenRouter error ${response.status}`);
      return null;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[AI] OpenRouter request timed out');
      } else {
        console.error('[AI] OpenRouter request failed:', err.message);
      }
      const delay = Math.pow(2, attempt) * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return null;
}

export async function askOpenRouterRequirements(userPrompt) {
  const prompt = requirementsPrompt(userPrompt);
  return await callOpenRouter(prompt);
}

export async function askOpenRouterArchitecturePlan(requirementsDoc) {
  const prompt = architecturePrompt(requirementsDoc);
  return await callOpenRouter(prompt);
}

export async function askOpenRouterUserStories(title, description) {
  const prompt = userStoriesPrompt(title, description);
  return await callOpenRouter(prompt);
}

export async function askOpenRouterCode(taskTitle, description, previewUrl, attempt, errorLogs) {
  const prompt = codePrompt(taskTitle, description, attempt, errorLogs);
  return await callOpenRouter(prompt);
}

export async function askOpenRouterFix(taskTitle, errorLogs) {
  const prompt = fixPrompt(taskTitle, errorLogs);
  return await callOpenRouter(prompt);
}
