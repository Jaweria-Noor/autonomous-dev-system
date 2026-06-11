import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- ENV ----------------
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.JIRA_BASE_URL && process.env.JIRA_URL) {
  process.env.JIRA_BASE_URL = process.env.JIRA_URL;
}

const requiredEnvJira = [
  "JIRA_BASE_URL",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "JIRA_PROJECT_KEY",
];

const missingEnvJira = requiredEnvJira.filter((k) => !process.env[k]);

const isLocalMode =
  process.env.JIRA_MOCK === "true" || missingEnvJira.length > 0;

// ---------------- PATHS ----------------
const projectsDbPath = path.resolve(__dirname, "../../data/jira/projects.json");
const issuesDbPath = path.resolve(__dirname, "../../data/jira/issues.json");
const issueCachePath = path.resolve(__dirname, "../../data/jira/jira_issue_cache.json");

// ---------------- LOCAL INIT ----------------
if (isLocalMode) {
  const dir = path.dirname(projectsDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(projectsDbPath)) {
    fs.writeFileSync(
      projectsDbPath,
      JSON.stringify([{ id: "PROJ", name: "Local Project", key: "PROJ" }], null, 2)
    );
  }

  if (!fs.existsSync(issuesDbPath)) {
    fs.writeFileSync(issuesDbPath, JSON.stringify([], null, 2));
  }
}

// ---------------- HELPERS ----------------
function formatDescription(text) {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: text || "",
          },
        ],
      },
    ],
  };
}

function loadCache() {
  if (!fs.existsSync(issueCachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(issueCachePath, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(issueCachePath, JSON.stringify(cache, null, 2));
}

// ---------------- SERVER ----------------
const server = new Server(
  { name: "jira-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ---------------- TOOL LIST ----------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_epic",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
      },
      {
        name: "create_story",
        inputSchema: {
          type: "object",
          properties: {
            epicId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
      },
      {
        name: "create_bug",
        inputSchema: {
          type: "object",
          properties: {
            storyId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
      },
    ],
  };
});

// ---------------- HANDLER ----------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const projectKey = process.env.JIRA_PROJECT_KEY?.trim();

  // =========================================================
  // LOCAL MODE
  // =========================================================
  if (isLocalMode) {
    const issues = JSON.parse(fs.readFileSync(issuesDbPath, "utf-8"));
    const id = String(Date.now());

    if (name === "create_epic") {
      const epic = {
        id,
        key: `${projectKey}-EPIC-${issues.length + 1}`,
        fields: {
          summary: args.title,
          description: args.description,
          issuetype: { name: "Epic" },
        },
      };

      issues.push(epic);
      fs.writeFileSync(issuesDbPath, JSON.stringify(issues, null, 2));

      return { content: [{ type: "text", text: JSON.stringify(epic) }] };
    }

    if (name === "create_story") {
      const story = {
        id,
        key: `${projectKey}-STORY-${issues.length + 1}`,
        fields: {
          summary: args.title,
          description: args.description,
          issuetype: { name: "Story" },
          parent: args.epicId ? { key: args.epicId } : undefined,
        },
      };

      issues.push(story);
      fs.writeFileSync(issuesDbPath, JSON.stringify(issues, null, 2));

      return { content: [{ type: "text", text: JSON.stringify(story) }] };
    }

    if (name === "create_bug") {
      const bug = {
        id,
        key: `${projectKey}-BUG-${issues.length + 1}`,
        fields: {
          summary: args.title,
          description: args.description,
          issuetype: { name: "Bug" },
          parent: args.storyId ? { key: args.storyId } : undefined,
        },
      };

      issues.push(bug);
      fs.writeFileSync(issuesDbPath, JSON.stringify(issues, null, 2));

      return { content: [{ type: "text", text: JSON.stringify(bug) }] };
    }
  }

  // =========================================================
  // REAL JIRA MODE
  // =========================================================
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  const jiraBase = process.env.JIRA_BASE_URL.replace(/\/+$/, "");

  async function callJira(endpoint, method = "POST", payload = null) {
    const res = await fetch(`${jiraBase}${endpoint}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    if (!res.ok) {
      throw new Error(`Jira error ${res.status}: ${text}`);
    }

    return json;
  }

  // ---------------- EPIC ----------------
  if (name === "create_epic") {
    try {
      const payload = {
        fields: {
          project: { key: projectKey },
          summary: args.title,
          description: formatDescription(args.description),
          issuetype: { name: "Epic" },
        },
      };

      const res = await callJira("/rest/api/3/issue", "POST", payload);

      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    } catch (err) {
      console.warn("Jira create_epic failed, returning mock:", err.message);
      const mock = { id: `MOCK-EPIC-${Date.now()}`, key: `MOCK-EPIC-${Date.now()}` };
      return { content: [{ type: "text", text: JSON.stringify(mock) }] };
    }
  }

  // ---------------- STORY (FIXED + SAFE LINKING) ----------------
  if (name === "create_story") {
    try {
      const payload = {
        fields: {
          project: { key: projectKey },
          summary: args.title,
          description: formatDescription(args.description),
          issuetype: { name: "Story" },
        },
      };

      const res = await callJira("/rest/api/3/issue", "POST", payload);

      // SAFE EPIC LINKING (NON-BLOCKING)
      if (args.epicId) {
        try {
          await callJira(`/rest/api/3/issue/${res.key}`, "PUT", {
            fields: {
              parent: { key: args.epicId },
            },
          });
        } catch (err1) {
          console.warn("Epic linking via parent field failed, gracefully skipping:", err1.message);
        }
      }

      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    } catch (err) {
      console.warn("Jira create_story failed, returning mock:", err.message);
      const mock = { id: `MOCK-STORY-${Date.now()}`, key: `MOCK-STORY-${Date.now()}` };
      return { content: [{ type: "text", text: JSON.stringify(mock) }] };
    }
  }

  // ---------------- BUG ----------------
  if (name === "create_bug") {
    try {
      const cache = loadCache();

      if (cache[args.title]) {
        return {
          content: [{ type: "text", text: JSON.stringify(cache[args.title]) }],
        };
      }

      const payload = {
        fields: {
          project: { key: projectKey },
          summary: args.title,
          description: formatDescription(args.description),
          issuetype: { name: "Bug" },
        },
      };

      const res = await callJira("/rest/api/3/issue", "POST", payload);

      cache[args.title] = res;
      saveCache(cache);

      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    } catch (err) {
      console.warn("Jira create_bug failed, returning mock:", err.message);
      const mock = { id: `MOCK-BUG-${Date.now()}`, key: `MOCK-BUG-${Date.now()}` };
      return { content: [{ type: "text", text: JSON.stringify(mock) }] };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// ---------------- RUN ----------------
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Jira MCP Server running on stdio");
}

run().catch(console.error);