import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generate } from '../../ai-agent/simulation.js';

const router = express.Router();

// Helper to get absolute path of generated-code directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_DIR = path.resolve(__dirname, '../../generated-code');
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

// POST /api/ai/generate
router.post('/generate', async (req, res) => {
  try {
    const { story, mode = 'initial', errorLog = '' } = req.body;
    if (!story || !story.title) {
      return res.status(400).json({ error: 'Story payload missing' });
    }
    // Run simulation engine
    const { files, logs } = await generate(story, mode, errorLog);
    // Write each file to generated-code
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(GENERATED_DIR, relativePath);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }
    // Emit logs via Socket.IO (assumes io attached to req.app.locals.io)
    const io = req.app.locals.io;
    if (io) {
      io.emit('ai-log', { storyId: story.id, mode, logs });
      io.emit('ai-complete', { storyId: story.id, files: Object.keys(files) });
    }
    res.json({ success: true, files: Object.keys(files), logs });
  } catch (err) {
    console.error('AI generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
