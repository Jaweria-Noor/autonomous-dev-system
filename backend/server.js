import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { DB } from './db.js';
import { runTaskWorkflow } from './runner.js';
import storiesRouter from './routes/stories.js';
import { JiraMCP, PlaywrightMCP } from './mcp/mcp-client.js';
import { initGeminiDiagnostics } from './engine/intelligence-engine.js';

// ----------------------------------------------------
// FIX: FORCE ROOT .env LOAD (IMPORTANT FOR YOUR ISSUE)
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// always load root .env (NOT backend .env confusion)
dotenv.config({ path: path.join(__dirname, '../.env') });
// Map legacy JIRA_URL to expected JIRA_BASE_URL if needed
if (!process.env.JIRA_BASE_URL && process.env.JIRA_URL) {
  process.env.JIRA_BASE_URL = process.env.JIRA_URL;
}
console.log("ENV LOADED:", process.env.JIRA_BASE_URL);

// Run diagnostic AFTER dotenv has populated process.env
initGeminiDiagnostics();
// Fallback for missing project key (placeholder)


// ----------------------------------------------------
// ENV VALIDATION (FIXED)
// ----------------------------------------------------
const requiredEnv = [
  'JIRA_BASE_URL',
  'JIRA_EMAIL',
  'JIRA_API_TOKEN',
  'JIRA_PROJECT_KEY',
  'PORT'
];

const missingEnv = [];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    missingEnv.push(key);
  }
}
if (missingEnv.length > 0) {
  console.warn('⚠️ Missing required env variables:', missingEnv.join(', '));
  // Continue without exiting; Jira-related functionality may be unavailable.
}


// ----------------------------------------------------
// GLOBAL ERROR HANDLING
// ----------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// ----------------------------------------------------
// EXPRESS APP
// ----------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// FILE PATHS
// ----------------------------------------------------
const screenshotsDir = path.join(__dirname, '../screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });
app.use('/screenshots', express.static(screenshotsDir));

const generatedCodeDir = path.join(__dirname, '../generated-code');
fs.mkdirSync(generatedCodeDir, { recursive: true });

const placeholderPath = path.join(generatedCodeDir, 'placeholder.html');
if (!fs.existsSync(placeholderPath)) {
  fs.writeFileSync(placeholderPath, `<h1>Preview Not Available</h1>`);
}

app.use('/preview', express.static(generatedCodeDir));

// ----------------------------------------------------
// SOCKET.IO
// ----------------------------------------------------
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('⚡ Client disconnected:', socket.id);
  });
});

// ----------------------------------------------------
// MCP STARTUP (SAFE)
// ----------------------------------------------------
async function startMCPs() {
  // Connect each MCP independently. Failure of one should not stop the server.
  try {
    await JiraMCP.connect();
    console.log('✅ Jira MCP connected');
  } catch (err) {
    console.error('❌ Jira MCP startup failed (non-fatal):', err);
  }
  try {
    await PlaywrightMCP.connect();
    console.log('✅ Playwright MCP connected');
  } catch (err) {
    console.error('❌ Playwright MCP startup failed (non-fatal):', err);
  }
}

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// GET TASKS
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await DB.getTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE TASK
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title & description required' });
    }

    const task = await DB.createTask({
      title,
      description,
      priority,
      category
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE TASK
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deleted = await DB.deleteTask(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXECUTE WORKFLOW
app.post('/api/tasks/:id/execute', async (req, res) => {
  try {
    const task = await DB.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    runTaskWorkflow(task._id.toString(), io).catch((err) => {
      console.error('Workflow error:', err);
    });

    res.json({ success: true, message: 'Workflow started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STORIES ROUTE
app.use('/api/stories', storiesRouter);

// ----------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', async (req, res) => {
  let jiraMcpReady = false;
  let playwrightMcpReady = false;

  try {
    await JiraMCP.listTools();
    jiraMcpReady = true;
  } catch {}

  try {
    await PlaywrightMCP.listTools();
    playwrightMcpReady = true;
  } catch {}

  res.json({
    status: 'ok',
    version: '1.0.0',
    jiraMcpReady,
    playwrightMcpReady
  });
});

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
async function bootstrap() {
  await startMCPs();

  // Choose a default port that is less likely to be in use. If PORT env var is set, use it; otherwise start at 3002 and fallback if needed.
  let PORT = parseInt(process.env.PORT, 10) || 3002;
  const startServer = () => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌐 Preview available at /preview`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${PORT} in use, trying next port...`);
        PORT += 1;
        startServer();
      } else {
        console.error('Server listen error:', err);
      }
    });
  };
  startServer();
}

bootstrap().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});