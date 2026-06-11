import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../logs/db.json');

// Ensure directories exist
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ tasks: [] }, null, 2));
}

function readData() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON database:", error);
    return { tasks: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to JSON database:", error);
  }
}

export const LocalDB = {
  getTasks: () => {
    return readData().tasks;
  },

  getTaskById: (id) => {
    const data = readData();
    return data.tasks.find(t => t._id === id);
  },

  createTask: (taskData) => {
    const data = readData();
    const newTask = {
      _id: 'local_' + Math.random().toString(36).substr(2, 9),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'Medium',
      category: taskData.category || 'General',
      status: 'Created',
      logs: [],
      retries: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...taskData
    };
    data.tasks.push(newTask);
    writeData(data);
    return newTask;
  },

  updateTask: (id, updateData) => {
    const data = readData();
    const index = data.tasks.findIndex(t => t._id === id);
    if (index !== -1) {
      data.tasks[index] = {
        ...data.tasks[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeData(data);
      return data.tasks[index];
    }
    return null;
  },

  deleteTask: (id) => {
    const data = readData();
    const filteredTasks = data.tasks.filter(t => t._id !== id);
    const deleted = data.tasks.length !== filteredTasks.length;
    data.tasks = filteredTasks;
    writeData(data);
    return deleted;
  }
};
