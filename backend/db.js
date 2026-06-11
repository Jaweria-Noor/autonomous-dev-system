// db.js – simple JSON fallback database
import fs from 'fs';
import path from 'path';

const dbFilePath = path.resolve(process.cwd(), 'data', 'db.json');
function ensureDB() {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify({ tasks: [] }, null, 2));
  }
}

function loadDB() {
  ensureDB();
  const raw = fs.readFileSync(dbFilePath, 'utf-8');
  return JSON.parse(raw);
}

function saveDB(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

export const DB = {
  async getTasks() {
    const db = loadDB();
    // Map each task's id to _id for frontend compatibility
    const tasks = db.tasks.map(t => ({ ...t, _id: t.id }));
    return tasks;
  },
  async createTask({ title, description, priority = 'Medium', category = 'Development' }) {
    const db = loadDB();
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      category,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    // Add _id alias for frontend
    const taskWithId = { ...newTask, _id: newTask.id };
    db.tasks.push(taskWithId);
    saveDB(db);
    return taskWithId;
  },
  async updateTaskStatus(id, status) {
    const db = loadDB();
    const task = db.tasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      saveDB(db);
    }
    return task;
  },
  async updateTask(id, updates) {
    const db = loadDB();
    const task = db.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      saveDB(db);
    }
    return task;
  },
  async deleteTask(id) {
    const db = loadDB();
    const index = db.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      db.tasks.splice(index, 1);
      saveDB(db);
      return true;
    }
    return false;
  },
  async getTaskById(id) {
    const db = loadDB();
    const task = db.tasks.find(t => t.id === id);
    if (task) {
      // Return with _id alias
      return { ...task, _id: task.id };
    }
    return undefined;
  }
};
