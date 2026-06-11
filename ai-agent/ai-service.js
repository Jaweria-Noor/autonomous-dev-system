import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

// Simple templates
const SIMULATED_TEMPLATES = {
  login: {
    title_keywords: ['login', 'signin', 'validation', 'email', 'auth'],
    firstAttempt: {
      'index.html': `<!DOCTYPE html><html><body class="bg-black text-white p-10"><form id="loginForm"><input id="emailInput" placeholder="Email"><p id="emailError" class="hidden text-red-500">Invalid</p><input id="passwordInput" placeholder="Password"><p id="passwordError" class="hidden text-red-500">Invalid</p><button id="submitBtn">Login</button></form><script>document.getElementById('submitBtn').addEventListener('click',(e)=>{e.preventDefault();})</script></body></html>`,
      'test.spec.js': `import { test, expect } from '@playwright/test'; test('login validation', async ({ page }) => { await page.goto('{PREVIEW_URL}'); await page.click('#submitBtn'); await expect(page.locator('#emailError')).toBeVisible(); });`
    },
    healed: {
      'index.html': `<!DOCTYPE html><html><body class="bg-black text-white p-10"><form id="loginForm"><input id="emailInput" placeholder="Email"><p id="emailError" class="hidden text-red-500">Invalid</p><input id="passwordInput" placeholder="Password"><p id="passwordError" class="hidden text-red-500">Invalid</p><button id="submitBtn">Login</button></form><script>document.getElementById('submitBtn').addEventListener('click',(e)=>{e.preventDefault();document.getElementById('emailError').classList.remove('hidden');})</script></body></html>`,
      'test.spec.js': `import { test, expect } from '@playwright/test'; test('login validation', async ({ page }) => { await page.goto('{PREVIEW_URL}'); await page.click('#submitBtn'); await expect(page.locator('#emailError')).toBeVisible(); });`
    }
  }
};

const DEFAULT_SIM_TEMPLATE = {
  firstAttempt: {
    'index.html': `<!DOCTYPE html><html><body><h1 id="title">Hello</h1><button id="actionBtn">Click</button><p id="msg" class="hidden">Done</p></body></html>`,
    'test.spec.js': `import { test, expect } from '@playwright/test'; test('generic action', async ({ page }) => { await page.goto('{PREVIEW_URL}'); await page.click('#actionBtn'); await expect(page.locator('#msg')).toBeVisible(); });`
  },
  healed: {
    'index.html': `<!DOCTYPE html><html><body><h1 id="title">Hello</h1><button id="actionBtn">Click</button><p id="msg" class="hidden">Done</p><script>document.getElementById('actionBtn').addEventListener('click',()=>{document.getElementById('msg').classList.remove('hidden')})</script></body></html>`,
    'test.spec.js': `import { test, expect } from '@playwright/test'; test('generic action', async ({ page }) => { await page.goto('{PREVIEW_URL}'); await page.click('#actionBtn'); await expect(page.locator('#msg')).toBeVisible(); });`
  }
};

const matchTemplate = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  for (const [key, tpl] of Object.entries(SIMULATED_TEMPLATES)) {
    if (tpl.title_keywords.some(kw => text.includes(kw))) {
      return tpl;
    }
  }
  return DEFAULT_SIM_TEMPLATE;
};

export const AIService = {
  generateRequirements: async (title, description) => {
    return `# Requirements Document\n## Title: ${title}\n## Description: ${description}\n\n1. **Functional Requirements**: The system shall implement the requested features.\n2. **Non-Functional**: The system must be responsive and fast.\n3. **Testability**: Elements must have unique IDs.`;
  },
  
  generateArchitecturePlan: async (requirements) => {
    return `# Architecture Plan\n\n## Frontend\n- Single HTML file structure (index.html)\n- Tailwind CSS via CDN\n- Vanilla JS for interactions\n\n## QA\n- Playwright test spec (test.spec.js)`;
  },
  
  generateUserStories: async (title, description) => {
    return {
      epic: {
        title: `[Epic] ${title}`,
        description: `Implement the core requirements for ${title}.`
      },
      stories: [
        {
          title: `[Story] UI Implementation for ${title}`,
          description: `Create the frontend index.html based on ${description}`
        },
        {
          title: `[Story] Test Implementation for ${title}`,
          description: `Create the Playwright test.spec.js`
        }
      ]
    };
  },

  generateCode: async (title, description, previewUrl, retryIndex = 0, errorLogs = "") => {
    const openai = getOpenAIClient();
    
    if (!openai) {
      console.log(`🤖 [Sim Mode] Processing autonomous generation request (Attempt: ${retryIndex + 1})`);
      const template = matchTemplate(title, description);
      
      const fileSource = (retryIndex === 0) ? template.firstAttempt : template.healed;
      
      const responseFiles = {};
      Object.keys(fileSource).forEach(filename => {
        responseFiles[filename] = fileSource[filename].replace('{PREVIEW_URL}', previewUrl);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { files: responseFiles };
    }

    // REAL OPENAI RUN
    let prompt = "";
    if (retryIndex === 0) {
      prompt = `You are a Senior Autonomous AI Developer.\nGenerate a self-contained Frontend web application component inside "index.html" based on:\nTitle: "${title}"\nDescription: "${description}"\n\nGenerate Playwright test in "test.spec.js" for "${previewUrl}".\nReturn strictly:\n{\n  "files": {\n    "index.html": "<fully-functional-interactive-html>",\n    "test.spec.js": "<playwright-test-spec>"\n  }\n}`;
    } else {
      prompt = `You are fixing a test failure.\nLogs:\n${errorLogs}\n\nRegenerate BOTH files with fixes.\nReturn strictly JSON format.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const resText = response.choices[0].message.content.trim();
      const data = JSON.parse(resText);
      return data;
    } catch (error) {
      console.error("OpenAI Code generation error:", error);
      throw new Error("Failed to generate code via OpenAI API: " + error.message);
    }
  }
};
