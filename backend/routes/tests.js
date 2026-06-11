// routes/tests.js – endpoint to run Playwright tests
import { Router } from "express";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

// Helper to get project root (where package.json lives)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

router.post('/run', async (req, res) => {
  try {
    const io = req.app.locals.io;
    // Spawn Playwright test run
    const cmd = "npm run test"; // defined in root package.json
    const child = exec(cmd, { cwd: projectRoot, timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        io && io.emit('test-log', { error: error.message, stdout, stderr });
        res.status(500).json({ success: false, error: error.message, stdout, stderr });
        return;
      }
      // Parse Playwright output for pass/fail (simple detection)
      const passed = /\bpassed\b/i.test(stdout);
      io && io.emit('test-log', { passed, stdout, stderr });
      io && io.emit('test-result', { passed, stdout, stderr });
      res.json({ success: true, passed, stdout, stderr });
    });
    // Stream live output to socket
    child.stdout.on('data', (data) => {
      io && io.emit('test-log', { message: data.toString() });
    });
    child.stderr.on('data', (data) => {
      io && io.emit('test-log', { error: data.toString() });
    });
  } catch (err) {
    const io = req.app.locals.io;
    io && io.emit('test-log', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
