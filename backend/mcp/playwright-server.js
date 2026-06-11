import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from 'dotenv';
dotenv.config();
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server(
  {
    name: "playwright-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_test",
        description: "Run Playwright tests for a specific task spec",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            testFile: { type: "string" },
          },
          required: ["taskId", "testFile"],
        },
      },
      {
        name: "take_screenshot",
        description: "Take a screenshot of the current test failure",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "get_trace",
        description: "Get Playwright trace for failure",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "get_test_results",
        description: "Get Playwright test output logs",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
      }
    ],
  };
});

// Helper to recursively find PNG files in a directory
function findPngFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findPngFiles(filePath, files);
    } else if (file.endsWith('.png')) {
      files.push(filePath);
    }
  }
  return files;
}

// Handle tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "run_test") {
    const { taskId, testFile } = args;
    const playwrightConfigPath = path.resolve(__dirname, "../../playwright-tests/playwright.config.js").replace(/\\/g, '/');
    
    // Command to execute playwright test specifically for this spec
    const cmd = `npx playwright test "${testFile}" --config="${playwrightConfigPath}"`;
    
    return new Promise((resolve) => {
      exec(cmd, { cwd: path.resolve(__dirname, '../../') }, (error, stdout, stderr) => {
        const resultLogPath = path.resolve(__dirname, `../../generated-code/task-${taskId}/playwright-output.log`);
        fs.writeFileSync(resultLogPath, stdout + "\\n" + stderr);

        resolve({
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              success: !error, 
              stdout: stdout.substring(0, 5000), // truncate if too long
              stderr: stderr.substring(0, 5000) 
            }) 
          }],
        });
      });
    });
  } 
  else if (name === "take_screenshot") {
    const resultsDir = path.resolve(__dirname, '../../test-results');
    const screenshotFiles = findPngFiles(resultsDir);
    
    if (screenshotFiles.length > 0) {
      screenshotFiles.sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
      const newestScreenshot = screenshotFiles[0];
      const publicScreenshotPath = path.resolve(__dirname, `../../screenshots/task-${args.taskId}.png`);
      
      const publicScreenshotsDir = path.dirname(publicScreenshotPath);
      if (!fs.existsSync(publicScreenshotsDir)) {
        fs.mkdirSync(publicScreenshotsDir, { recursive: true });
      }
      fs.copyFileSync(newestScreenshot, publicScreenshotPath);
      
      return { content: [{ type: "text", text: `/screenshots/task-${args.taskId}.png` }] };
    }
    return { content: [{ type: "text", text: `No screenshots found.` }] };
  }
  else if (name === "get_test_results") {
    const resultLogPath = path.resolve(__dirname, `../../generated-code/task-${args.taskId}/playwright-output.log`);
    if (fs.existsSync(resultLogPath)) {
      return { content: [{ type: "text", text: fs.readFileSync(resultLogPath, "utf-8") }] };
    }
    return { content: [{ type: "text", text: `No test results found.` }] };
  }
  else if (name === "get_trace") {
    return { content: [{ type: "text", text: `Traces are not explicitly handled in this mock yet, but would be downloaded here.` }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Playwright MCP Server running on stdio");
}

run().catch(console.error);
