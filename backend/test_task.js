import { DB } from './db.js';
import { runTaskWorkflow } from './runner.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy IO for Socket.io
const io = {
  emit: (event, data) => {
    // console.log(`[Socket.io Emitted: ${event}] -> ${data.status}`);
  }
};

async function testFullTask() {
  console.log("=== Testing Autonomous Dev Factory ===");
  try {
    const task = await DB.createTask({
      title: "Full Pipeline Integration Test",
      description: "Build a login page with full validation for email and password.",
      priority: "High",
      category: "Auth"
    });
    
    console.log(`Created Task: ${task.id}`);
    
    await runTaskWorkflow(task.id, io);
    
    console.log(`\\nWorkflow Complete. Checking generated artifacts...`);
    
    const taskDir = path.resolve(__dirname, `../generated-code/task-${task.id}`);
    
    const files = fs.readdirSync(taskDir);
    console.log(`\\nFiles generated in task-${task.id}:`);
    files.forEach(f => console.log(` - ${f}`));
    
    // Check ZIP
    const zipExists = fs.existsSync(path.resolve(__dirname, `../generated-code/task-${task.id}-deployment.zip`));
    console.log(`\\nDeployment ZIP Generated: ${zipExists}`);
    
  } catch (e) {
    console.error("Test Error:", e);
  }
  process.exit(0);
}

testFullTask();
