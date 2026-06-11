// Fallback templates used when Gemini API is unavailable
// Provides simple deterministic content for each generation step.

export const fallbackRequirements = `# Requirements - Task Manager Application

## Functional Requirements
- Users shall be able to add new tasks with a title, description, and priority level (Low, Medium, High).
- Users shall be able to view a list of all active tasks.
- Users shall be able to mark tasks as completed.
- Users shall be able to delete tasks from the list.
- Include a filter to view tasks by status (All, Active, Completed).

## Non-Functional Requirements
- Modern, responsive, premium UI with a dark mode aesthetic.
- Interactive animations and transitions.
- Vanilla HTML, CSS, and JS only.

## Testability
- All input fields, buttons, and task lists must have distinct IDs or test attributes.`;

export const fallbackArchitecture = `# Architecture Plan - Task Manager

## UI Component (Frontend)
- **index.html**: Containing structure, inline CSS stylesheet for premium styling, and JavaScript logic for reactive DOM updates.
- Tailwind/Vanilla CSS: Using custom CSS variables, custom palettes, flexbox layout, and hover micro-animations.

## QA Suite
- **test.spec.js**: Playwright test suite validating task creation, completion, and deletion.`;

export const fallbackUserStories = JSON.stringify({
  epic: {
    title: "Task Manager Core Features",
    description: "Implement core capabilities of the Task Manager app including creation, listing, completion, and deletion."
  },
  stories: [
    {
      title: "Task Creation and Listing",
      description: "As a user, I want to add tasks and see them in a list so that I can organize my work."
    },
    {
      title: "Task Lifecycle Management",
      description: "As a user, I want to mark tasks as completed and delete tasks to keep my list clean."
    }
  ]
});

export const fallbackCode = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Task Manager</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b071e;
      --card-bg: rgba(255, 255, 255, 0.03);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #8a2be2;
      --primary-hover: #9d4edd;
      --text: #f3efff;
      --text-muted: #a59cb8;
      --success: #00f0b5;
      --danger: #ff5e7e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-color);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      background-image: radial-gradient(circle at 10% 20%, rgba(90, 40, 180, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(130, 40, 220, 0.1) 0%, transparent 40%);
    }

    .container {
      width: 100%;
      max-width: 550px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 40px;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #f3efff, #b39ddb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;
    }

    .subtitle {
      color: var(--text-muted);
      text-align: center;
      margin-bottom: 30px;
      font-size: 1rem;
    }

    .form-group {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      padding: 16px 20px;
      border-radius: 14px;
      color: var(--text);
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 15px rgba(138, 43, 226, 0.25);
    }

    button {
      background: linear-gradient(135deg, var(--primary), #673ab7);
      border: none;
      color: var(--text);
      padding: 16px 28px;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(103, 58, 183, 0.3);
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(103, 58, 183, 0.5);
    }

    button:active {
      transform: translateY(1px);
    }

    .task-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--card-border);
      padding: 16px 20px;
      border-radius: 16px;
      transition: all 0.3s ease;
    }

    .task-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.15);
      transform: scale(1.01);
    }

    .task-text {
      font-size: 1.05rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .task-item.completed .task-text {
      text-decoration: line-through;
      color: var(--text-muted);
      opacity: 0.6;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--danger);
      cursor: pointer;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 8px;
      box-shadow: none;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .delete-btn:hover {
      background: rgba(255, 94, 126, 0.15);
      transform: none;
      box-shadow: none;
    }

    .empty-state {
      text-align: center;
      color: var(--text-muted);
      padding: 30px 0;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Task Manager</h1>
    <p class="subtitle">Organize your tasks elegantly</p>
    
    <div class="form-group">
      <input type="text" id="taskInput" placeholder="Enter task description..." autocomplete="off">
      <button id="addBtn">Add Task</button>
    </div>

    <ul class="task-list" id="taskList">
      <!-- Tasks injected here -->
    </ul>
    <p class="empty-state" id="emptyState">No tasks added yet.</p>
  </div>

  <script>
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');

    let tasks = [];

    function renderTasks() {
      taskList.innerHTML = '';
      if (tasks.length === 0) {
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        tasks.forEach((task, idx) => {
          const li = document.createElement('li');
          li.className = \`task-item \${task.completed ? 'completed' : ''}\`;
          li.innerHTML = \`
            <span class="task-text" onclick="toggleTask(\${idx})">\${task.text}</span>
            <button class="delete-btn" onclick="deleteTask(\${idx})">Delete</button>
          \`;
          taskList.appendChild(li);
        });
      }
    }

    function addTask() {
      const text = taskInput.value.trim();
      if (text) {
        tasks.push({ text, completed: false });
        taskInput.value = '';
        renderTasks();
      }
    }

    window.toggleTask = function(idx) {
      tasks[idx].completed = !tasks[idx].completed;
      renderTasks();
    };

    window.deleteTask = function(idx) {
      tasks.splice(idx, 1);
      renderTasks();
    };

    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });

    renderTasks();
  </script>
</body>
</html>`,

  "test.spec.js": `import { test, expect } from '@playwright/test';

test('task manager operations', async ({ page }) => {
  // Navigate to task manager
  await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001');

  // Verify elements are visible
  await expect(page.locator('h1')).toHaveText('Task Manager');
  const emptyState = page.locator('#emptyState');
  await expect(emptyState).toBeVisible();

  // Add a task
  const input = page.locator('#taskInput');
  await input.fill('Verify E2E Pipeline');
  await page.click('#addBtn');

  // Verify task was added
  await expect(emptyState).toBeHidden();
  const taskText = page.locator('.task-text');
  await expect(taskText).toHaveText('Verify E2E Pipeline');

  // Complete task
  await taskText.click();
  await expect(page.locator('.task-item')).toHaveClass(/completed/);

  // Delete task
  await page.click('.delete-btn');
  await expect(emptyState).toBeVisible();
});`
};

export const fallbackFix = `# Fix Suggestions

- Check selectors in test.spec.js to make sure they match index.html elements.
- Verify page load timeouts and network requests.`;
