import fs from 'fs';
import path from 'path';

function loadCache() {
  const cachePath = path.resolve(__dirname, '../data/jira_issue_cache.json');
  if (!fs.existsSync(cachePath)) return {};
  return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
}
function saveCache(cache) {
  const cachePath = path.resolve(__dirname, '../data/jira_issue_cache.json');
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

import { fileURLToPath } from 'url';
import { DB } from './db.js';
import { AIService } from './engine/intelligence-engine.js';
import { JiraMCP, PlaywrightMCP } from './mcp/mcp-client.js';
import { buildDeploymentZip } from './packaging/zip-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runTaskWorkflow(taskId, io) {
  let task = await DB.getTaskById(taskId);
  if (!task) return;

  const maxRetries = 3; // Enforce maximum retry limit of 3
  const taskDir = path.resolve(__dirname, `../generated-code/task-${taskId}`);
  
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }

  const port = process.env.PORT || 3001;
  const previewUrl = `http://localhost:${port}/preview/task-${taskId}/index.html`;

  const addLog = async (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    task = await DB.getTaskById(taskId);
    const updatedLogs = [...(task.logs || []), logEntry];
    task = await DB.updateTask(taskId, { logs: updatedLogs });
    io.emit('task-update', task);
    console.log(`[Task ${taskId}] [${type.toUpperCase()}] ${message}`);
  };

  const updateStatus = async (status) => {
    task = await DB.updateTask(taskId, { status });
    io.emit('task-update', task);
  };

  let activeBugId = null;
  const jiraCache = loadCache();
  let epicId = jiraCache.epic || null;
  if (!epicId) {
    epicId = `MOCK-EPIC-${Date.now()}`;
  }

  try {
    // Stage 1: Requirements & Planning
    await updateStatus(`Reading Task`);
    await addLog(`Initializing Autonomous Pipeline for Task: "${task.title}"`, 'info');

    // Generate Requirements
    await addLog(`Generating Requirements Document via AI Engine...`, 'info');
    const reqDoc = await AIService.generateRequirements(task.title, task.description);
    fs.writeFileSync(path.join(taskDir, 'requirements.md'), reqDoc);

    // Generate Architecture Plan
    await addLog(`Generating Architecture Plan...`, 'info');
    const archPlan = await AIService.generateArchitecturePlan(reqDoc);
    fs.writeFileSync(path.join(taskDir, 'architecture_plan.md'), archPlan);

    // Generate & Create Jira Epics/Stories via MCP
    await addLog(`Creating Epics and Stories via Jira MCP Server...`, 'info');
    const storiesData = await AIService.generateUserStories(task.title, task.description);
    
    try {
      if (!jiraCache.epic) {
        const epicRes = await JiraMCP.callTool("create_epic", {
          title: storiesData.epic.title,
          description: storiesData.epic.description
        });
        epicId = epicRes.id || epicRes;
        jiraCache.epic = epicId;
        saveCache(jiraCache);
        await addLog(`Successfully created Jira Epic: ${epicId}`, 'success');
      } else {
        epicId = jiraCache.epic;
        await addLog(`Reusing cached Jira Epic: ${epicId}`, 'info');
      }

      if (!jiraCache.stories) jiraCache.stories = {};
        for (const story of storiesData.stories) {
          if (jiraCache.stories[story.title]) {
            await addLog(`Reusing cached Jira Story for "${story.title}"`, 'info');
            continue;
          }
          const storyRes = await JiraMCP.callTool("create_story", {
            epicId,
            title: story.title,
            description: story.description
          });
          const storyId = storyRes.id || storyRes;
          jiraCache.stories[story.title] = storyId;
          saveCache(jiraCache);
          await addLog(`Successfully created Jira Story: ${storyId}`, 'success');
        }
    } catch (jiraErr) {
      await addLog(`Jira MCP call failed, proceeding in Local Mock Mode: ${jiraErr.message}`, 'warning');
    }

    let attempt = 0;
    let success = false;
    let errorLogs = "";

    // Autonomous Loop with enhanced healing diagnostics
    const crypto = await import('crypto');
    const computeHash = (content) => crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const attemptsLogPath = path.join(taskDir, 'healing_attempts.json');
    let attemptsLog = { attempts: [] };
    if (fs.existsSync(attemptsLogPath)) {
      try { attemptsLog = JSON.parse(fs.readFileSync(attemptsLogPath, 'utf-8')); } catch (_) {}
    }
    while (attempt <= maxRetries && !success) {
      if (attempt > 0) {
        await updateStatus(`Fixing Errors`);
        await addLog(`Attempt ${attempt}/${maxRetries} - Healing bug...`, 'warning');
        await DB.updateTask(taskId, { retries: attempt });
      }

      // Step 2: Code Generation with duplicate detection
      await updateStatus(`Generating Code`);
      await addLog(`Requesting AI code generation...`, 'info');

      const generated = await AIService.generateCode(task.title, task.description, previewUrl, attempt, errorLogs);

      // Compute hashes and compare with previous attempt
      const newHashes = {};
      for (const [filename, content] of Object.entries(generated.files)) {
        newHashes[filename] = computeHash(content);
      }
      const prevAttempt = attemptsLog.attempts[attemptsLog.attempts.length - 1] || {};
      const prevHashes = prevAttempt.fileHashes || {};
      const identical = Object.keys(newHashes).every(f => newHashes[f] === prevHashes[f]);
      if (identical && attempt > 0) {
        await addLog(`Generated code identical to previous attempt. Skipping regeneration to avoid infinite loop.`, 'warning');
        // Break to avoid further retries; mark as failure to let pipeline end
        break;
      }

      const filesWritten = [];
      for (const [filename, content] of Object.entries(generated.files)) {
        const filePath = path.join(taskDir, filename);
        fs.writeFileSync(filePath, content);
        filesWritten.push(filename);
      }

      // Store iteration files and hashes for traceability
      fs.writeFileSync(path.join(taskDir, `iteration-${attempt}-files.json`), JSON.stringify({ files: generated.files, fileHashes: newHashes }, null, 2));

      await DB.updateTask(taskId, { generatedFiles: filesWritten });
      await addLog(`Generated files: ${filesWritten.join(', ')}`, 'success');

      // Step 3: Running Tests via Playwright MCP
      await updateStatus(`Running Tests`);
      await addLog(`Dispatching tests to Playwright MCP Server...`, 'info');

      const testFile = path.join(taskDir, 'test.spec.js').replace(/\\/g, '/');

      try {
        const playRes = await PlaywrightMCP.callTool("run_test", { taskId, testFile });
        const playResultParsed = typeof playRes === 'string' ? JSON.parse(playRes) : playRes;

        if (playResultParsed.success) {
          success = true;
          await updateStatus(`Deployment Ready`);
          await addLog(`Playwright tests passed successfully!`, 'success');

          if (activeBugId) {
            try {
              await JiraMCP.callTool("update_status", { issueId: activeBugId, status: "Done", type: "bug" });
              await addLog(`Closed Jira Bug: ${activeBugId}`, 'success');
            } catch (err) {
              console.error('Failed to close Jira bug:', err);
            }
            activeBugId = null;
          }
        } else {
          // Test failed handling - now include AI-driven fix generation
          errorLogs = playResultParsed.stdout + "\n" + playResultParsed.stderr;

          // Store iteration error logs
          fs.writeFileSync(path.join(taskDir, `iteration-${attempt}-error.log`), errorLogs);

          // Capture diagnostics (screenshot, trace, Jira bug) as before
          let screenshotUrl = 'No screenshots found.';
          try {
            const screenRes = await PlaywrightMCP.callTool("take_screenshot", { taskId });
            screenshotUrl = typeof screenRes === 'string' ? screenRes : screenRes.url || screenRes;
            if (screenshotUrl && screenshotUrl !== 'No screenshots found.') {
              await DB.updateTask(taskId, { screenshotUrl });
              await addLog(`Captured failure screenshot: ${screenshotUrl}`, 'warning');
            }
          } catch (screenErr) {
            console.error('Failed to capture screenshot via MCP:', screenErr);
          }

          let traceUrl = 'N/A';
          try {
            const traceRes = await PlaywrightMCP.callTool("get_trace", { taskId });
            traceUrl = typeof traceRes === 'string' ? traceRes : traceRes.url || 'N/A';
          } catch (traceErr) {
            console.error('Failed to get trace via MCP:', traceErr);
          }

          // Create Jira Bug for the failure
          try {
            const bugRes = await JiraMCP.callTool("create_bug", {
              storyId: epicId,
              title: `Test Failure on ${task.title} (Attempt ${attempt + 1})`,
              description: `Logs:\n${errorLogs.substring(0, 500)}\nScreenshot: ${screenshotUrl}\nTrace: ${traceUrl}`,
              traceUrl
            });
            activeBugId = bugRes.id || bugRes;
            await addLog(`Created Jira Bug: ${activeBugId} for investigation`, 'warning');
          } catch (jiraBugErr) {
            await addLog(`Failed to log bug to Jira MCP: ${jiraBugErr.message}`, 'warning');
          }

// *** AI-driven healing step ***
          try {
            const fixResult = await AIService.generateFix(task.title, errorLogs);
            const fixes = (fixResult && fixResult.files) ? fixResult.files : {};
            const fixedFiles = [];
            for (const [filename, content] of Object.entries(fixes)) {
              const filePath = path.join(taskDir, filename);
              fs.writeFileSync(filePath, content);
              fixedFiles.push(filename);
            }
            await addLog(`Applied AI-generated fixes to files: ${fixedFiles.join(', ')}`, 'info');
          } catch (fixErr) {
            await addLog(`AI fix generation/application failed: ${fixErr.message}`, 'error');
          }

          // Record healing attempt details
          attemptsLog.attempts.push({
            attemptNumber: attempt,
            errorLogs,
            fileHashes: newHashes,
            screenshotUrl,
            traceUrl,
            bugId: activeBugId || null,
            generatedFiles: filesWritten
          });
          fs.writeFileSync(attemptsLogPath, JSON.stringify(attemptsLog, null, 2));

          // Increment attempt counter for next loop iteration
          attempt++;
          if (attempt > maxRetries) {
            await updateStatus(`Failed`);
            await addLog(`Workflow failed after exceeding max retries.`, 'error');
          }
        }
      } catch (testErr) {
        errorLogs = testErr.message;
        fs.writeFileSync(path.join(taskDir, `iteration-${attempt}-error.log`), errorLogs);
        attempt++;
        await addLog(`Error running Playwright tests: ${testErr.message}`, 'error');
        if (attempt > maxRetries) {
          await updateStatus(`Failed`);
        }
      }
    }
      // NOTE: Removed duplicated generation and test execution block after the autonomous healing loop. The workflow now ends after the loop, proceeding directly to reporting and packaging.

    // Removed stray closing brace to fix syntax

    // Stage 4: Reporting & Packaging (Always run to package code and report, even on failure)
    await addLog(`Generating final reports and packaging deployment artifacts...`, 'info');

    // Include healing diagnostics summary if attempts were made
    let healingSummary = '';
    if (attemptsLog.attempts && attemptsLog.attempts.length > 0) {
      const last = attemptsLog.attempts[attemptsLog.attempts.length - 1];
      healingSummary = `\n## Healing Diagnostics\n- Attempts: ${attemptsLog.attempts.length}\n- Last attempt errors captured\n- Bug ID: ${last.bugId || 'N/A'}\n- Screenshot: ${last.screenshotUrl || 'N/A'}\n- Trace: ${last.traceUrl || 'N/A'}\n`;
    }
    const reportMd = `# Execution Report: ${task.title}
- Total Attempts: ${attempt}
- Status: ${success ? 'Success' : 'Failed'}
- Epics/Stories/Bugs tracked in Jira MCP.
- Test Run Results: ${success ? 'Passed' : 'Failed'}
${errorLogs ? `\n## Error Logs\n\`\`\`\n${errorLogs}\n\`\`\`` : ''}${healingSummary}`;
    fs.writeFileSync(path.join(taskDir, 'report.md'), reportMd);
    fs.writeFileSync(path.join(taskDir, 'report.json'), JSON.stringify({ success, attempts: attempt, errorLogs, healingAttempts: attemptsLog.attempts }));

    const zipPath = path.resolve(__dirname, `../generated-code/task-${taskId}-deployment.zip`);
    try {
      const zipResult = await buildDeploymentZip(taskDir, zipPath);
      await addLog(`Artifact packaged successfully: task-${taskId}-deployment.zip (${zipResult.sizeBytes} bytes, ${zipResult.fileCount} files)`, 'success');
      if (success) {
        await updateStatus(`Success`);
      } else {
        await updateStatus(`Failed`);
      }
    } catch (zipErr) {
      await addLog(`Packaging Error: ${zipErr.message}`, 'error');
      await updateStatus(`Failed`);
    }

// Duplicate final report and packaging block removed to avoid redundancy

  } catch (error) {
    await updateStatus(`Failed`);
    await addLog(`Fatal Pipeline Error: ${error.message}`, 'error');
  }
}
