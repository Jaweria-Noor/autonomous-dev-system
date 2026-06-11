// routes/stories.js – CRUD API for user stories (tasks)
import { Router } from "express";
import { DB } from "../db.js";

const router = Router();

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await DB.getTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new task/story
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }
    const task = await DB.createTask({ title, description, priority, category });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await DB.updateTaskStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a task
router.delete("/:id", async (req, res) => {
  try {
    const success = await DB.deleteTask(req.params.id);
    if (!success) return res.status(404).json({ error: "Task not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
