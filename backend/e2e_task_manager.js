// backend/e2e_task_manager.js
// Automated E2E verification test for "Build a Task Manager" scenario.

import { DB } from './db.js';
import { runTaskWorkflow } from './runner.js';
import './server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy IO for Socket.io
const io = {
  emit: (event, data) => {
    if (event === 'task-update') {
      console.log(`[Socket.io Task Update] Status: ${data.status}`);
    }
  }
};

async function runE2E() {
  console.log("==================================================");
  console.log("🚀 STARTING E2E TEST: Build a Task Manager");
  console.log("==================================================");

  try {
    // 1. Create task
    const task = await DB.createTask({
      title: "Build a Task Manager",
      description: "Build a lightweight Task Manager application where users can add tasks, view tasks, and delete tasks.",
      priority: "High",
      category: "Feature"
    });

    console.log(`[E2E] Created Task ID: ${task.id}`);

    // 2. Execute pipeline
    await runTaskWorkflow(task.id, io);

    // 3. Acceptance Criteria Verifications
    console.log("\n==================================================");
    console.log("🔍 RUNNING ACCEPTANCE CRITERIA VERIFICATIONS");
    console.log("==================================================");

    const taskDir = path.resolve(__dirname, `../generated-code/task-${task.id}`);
    
    // Check Requirements
    const reqExists = fs.existsSync(path.join(taskDir, 'requirements.md'));
    console.log(`[E2E] Requirements document generated: ${reqExists ? 'PASS' : 'FAIL'}`);

    // Check Architecture
    const archExists = fs.existsSync(path.join(taskDir, 'architecture_plan.md'));
    console.log(`[E2E] Architecture plan generated: ${archExists ? 'PASS' : 'FAIL'}`);

    // Check Code and Tests
    const indexHtmlExists = fs.existsSync(path.join(taskDir, 'index.html'));
    console.log(`[E2E] Source code (index.html) generated: ${indexHtmlExists ? 'PASS' : 'FAIL'}`);

    const testSpecExists = fs.existsSync(path.join(taskDir, 'test.spec.js'));
    console.log(`[E2E] Playwright test spec (test.spec.js) generated: ${testSpecExists ? 'PASS' : 'FAIL'}`);

    // Check Jira Epic/Stories
    const issuesPath = path.resolve(__dirname, '../data/jira/issues.json');
    let jiraValid = false;
    let epicCreated = false;
    let storiesCreated = false;
    if (fs.existsSync(issuesPath)) {
      const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'));
      epicCreated = issues.some(issue => issue.type === 'Epic' && issue.title.includes('Task Manager'));
      storiesCreated = issues.some(issue => issue.type === 'Story');
      jiraValid = epicCreated && storiesCreated;
    }
    console.log(`[E2E] Jira Epic created: ${epicCreated ? 'PASS' : 'FAIL'}`);
    console.log(`[E2E] Jira Stories created: ${storiesCreated ? 'PASS' : 'FAIL'}`);

    // Check ZIP artifact
    const zipPath = path.resolve(__dirname, `../generated-code/task-${task.id}-deployment.zip`);
    const zipExists = fs.existsSync(zipPath);
    console.log(`[E2E] Deployment ZIP artifact produced: ${zipExists ? 'PASS' : 'FAIL'}`);

    // Verify file count in directory is <= 50 (since it contains iteration logs)
    const files = fs.readdirSync(taskDir);
    const fileCount = files.length;
    console.log(`[E2E] Final file count in directory: ${fileCount} (Limit: <= 50) - ${fileCount <= 50 ? 'PASS' : 'FAIL'}`);

    const reportExists = fs.existsSync(path.join(taskDir, 'report.md'));
    console.log(`[E2E] Execution report generated: ${reportExists ? 'PASS' : 'FAIL'}`);

    if (reqExists && archExists && indexHtmlExists && testSpecExists && jiraValid && zipExists && fileCount <= 50) {
      console.log("\n✅ E2E TEST PASSED SUCCESSFULLY!");
      process.exit(0);
    } else {
      console.error("\n❌ E2E TEST FAILED - SOME CRITERIA NOT MET");
      process.exit(1);
    }
  } catch (err) {
    console.error("\n❌ E2E TEST ENCOUNTERED FATAL ERROR:", err);
    process.exit(1);
  }
}

runE2E();
