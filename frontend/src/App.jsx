import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Play, Trash2, Cpu, Terminal, CheckCircle2, AlertTriangle, 
  RefreshCw, Layers, ExternalLink, Settings, LayoutDashboard, 
  HelpCircle, Code, Image as ImageIcon, CheckCircle, Database, 
  Key, Sparkles, Send, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newCategory, setNewCategory] = useState('Auth');
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'screenshot'

  const consoleEndRef = useRef(null);

  // Computed selected task
  const selectedTask = tasks.find(t => t._id === selectedTaskId) || tasks[0];

  // Show Toast Alert
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Connect WebSockets and Load initial data
  useEffect(() => {
    fetchTasks();

    // Check if key is configured (mock indicator)
    setIsApiKeySet(false);

    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('task-update', (updatedTask) => {
      setTasks(prev => {
        const index = prev.findIndex(t => t._id === updatedTask._id);
        if (index === -1) {
          return [updatedTask, ...prev];
        }
        const copy = [...prev];
        copy[index] = updatedTask;
        return copy;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update console log viewport on change
  useEffect(() => {
    if (selectedTask?.logs) {
      setLogs(selectedTask.logs);
      setTimeout(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedTask?.logs]);

  const API_BASE = 'http://localhost:3001';
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(data);
      if (data.length > 0 && !selectedTaskId) {
        setSelectedTaskId(data[0]._id);
      }
    } catch (error) {
      showToast("Error loading tasks", "error");
    }
  };

  const createTask = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      showToast("Please fill in task title and details", "warning");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          priority: newPriority,
          category: newCategory
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => [data, ...prev]);
        setSelectedTaskId(data._id);
        setNewTitle('');
        setNewDesc('');
        showToast("Task created successfully!", "success");
        // Automatically trigger the workflow execution
        runWorkflow(data._id);
      } else {
        showToast(data.error || "Failed to create task", "error");
      }
    } catch (error) {
      showToast("Network error creating task", "error");
    }
  };

  const runWorkflow = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/execute`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast("Autonomous agent workflow launched!", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to start workflow", "error");
      }
    } catch (error) {
      showToast("Error connecting to server", "error");
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null);
        }
        showToast("Task deleted", "info");
      }
    } catch (error) {
      showToast("Error deleting task", "error");
    }
  };

  // Templates Helper
  const applyTemplate = (type) => {
    if (type === 'login') {
      setNewTitle("Create responsive login page with validation");
      setNewDesc("Create a sleek dark-themed login form. It must contain email validation (checking for '@' and standard domains) and password length verification (minimum 6 characters). Error text elements should have IDs '#emailError' and '#passwordError' respectively.");
      setNewPriority("High");
      setNewCategory("Auth");
    } else if (type === 'todo') {
      setNewTitle("Create interactive Todo application");
      setNewDesc("Create a Todo checklist page. Users can type tasks into input '#todoInput' and click button '#addBtn' to append items to list '#todoList'. Ensure adding an item clears the input box.");
      setNewPriority("Medium");
      setNewCategory("Interactive");
    }
  };

  // Get status color tokens
  const getStatusColor = (status) => {
    switch (status) {
      case 'Created': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'Reading Task': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Generating Code': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Running Tests': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Fixing Errors': return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
      case 'Deployment Ready':
      case 'Success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    }
  };

  // Get priority color tokens
  const getPriorityColor = (p) => {
    switch(p) {
      case 'High': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'Medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  // Timeline phases builder
  const timelineStages = [
    { name: 'Created', desc: 'Task added to DB' },
    { name: 'Reading Task', desc: 'AI digesting specifications' },
    { name: 'Generating Code', desc: 'Writing files & test specs' },
    { name: 'Running Tests', desc: 'Executing Playwright suite' },
    { name: 'Fixing Errors', desc: 'Healing bugs via failure feedback' },
    { name: 'Deployment Ready', desc: 'Pipeline verified successfully' }
  ];

  const getStageIndex = (status) => {
    if (status === 'Failed') return 4;
    return timelineStages.findIndex(s => s.name === status);
  };

  const currentStageIdx = selectedTask ? getStageIndex(selectedTask.status) : -1;

  return (
    <div className="flex h-screen bg-[#080315] text-slate-100 font-sans overflow-hidden scanline">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
              toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20' :
              toast.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-400 shadow-rose-950/20' :
              toast.type === 'warning' ? 'bg-amber-950/80 border-amber-500/30 text-amber-400 shadow-amber-950/20' :
              'bg-purple-950/80 border-purple-500/30 text-purple-400 shadow-purple-950/20'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">AETHERDEV</h1>
              <span className="text-[10px] text-purple-400/70 font-mono tracking-widest uppercase">Autonomous MCP</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-purple-600/20 border border-purple-500/30 text-white glow-purple' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-semibold">Workspace Board</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'settings' 
                  ? 'bg-purple-600/20 border border-purple-500/30 text-white glow-purple' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-semibold">Service Settings</span>
            </button>
          </nav>
        </div>

        {/* System Diagnostics Info Panel */}
        <div className="p-4 m-4 rounded-xl bg-purple-950/20 border border-purple-500/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>WebSocket Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Fallback Database</span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Database className="w-3 h-3" /> JSON-DB
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>AI Environment</span>
            <span className={`flex items-center gap-1 text-xs font-semibold ${isApiKeySet ? 'text-purple-400' : 'text-slate-400'}`}>
              <Sparkles className="w-3 h-3" /> {isApiKeySet ? "OpenAI Real" : "Simulation Mode"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Core Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#090514]/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Layers className="text-purple-500 w-5 h-5" />
            <h2 className="text-sm font-semibold text-purple-200">Autonomous Test-Driven Development pipeline</h2>
          </div>
          <div className="flex items-center gap-4">
            {!isApiKeySet && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>Running in Simulation Mode. Connect API keys in Settings tab.</span>
              </div>
            )}
            <div className="text-xs text-slate-400 font-mono">
              Workspace: <span className="text-purple-300">Jaweria-Noor/SmartVision/dev-workflow</span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Top Stat Metrics Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg border border-white/5">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Pipelines</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{tasks.length}</h3>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shadow-neon-purple">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg border border-white/5">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Running</p>
                  <h3 className="text-2xl font-bold text-blue-400 mt-1">
                    {tasks.filter(t => !['Created', 'Success', 'Deployment Ready', 'Failed'].includes(t.status)).length}
                  </h3>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg border border-white/5">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Verified Successful</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                    {tasks.filter(t => ['Success', 'Deployment Ready'].includes(t.status)).length}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg border border-white/5">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Failed Pipelines</p>
                  <h3 className="text-2xl font-bold text-rose-400 mt-1">
                    {tasks.filter(t => t.status === 'Failed').length}
                  </h3>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Core Work Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Task list and creator panel (Left, Col-span 5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Submit New Task form */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                    <button onClick={() => applyTemplate('login')} className="text-[10px] bg-purple-950/60 border border-purple-500/20 text-purple-300 font-semibold px-2 py-1 rounded hover:bg-purple-900/50 flex items-center gap-1 transition-colors">
                      <Sparkles className="w-2.5 h-2.5" /> Login Spec
                    </button>
                    <button onClick={() => applyTemplate('todo')} className="text-[10px] bg-purple-950/60 border border-purple-500/20 text-purple-300 font-semibold px-2 py-1 rounded hover:bg-purple-900/50 flex items-center gap-1 transition-colors">
                      <Sparkles className="w-2.5 h-2.5" /> Todo Spec
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-500" /> Create Autonomous Task
                  </h3>
                  
                  <form onSubmit={createTask} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Task Title</label>
                      <input 
                        type="text" 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)} 
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:shadow-neon-purple transition-all" 
                        placeholder="e.g. Responsive login page with validation"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Task Description / Prompt</label>
                      <textarea 
                        value={newDesc} 
                        onChange={e => setNewDesc(e.target.value)} 
                        rows={3}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:shadow-neon-purple transition-all resize-none" 
                        placeholder="Specify functional requirements, error cases, button selectors, input fields and IDs for the AI to validate..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                        <select 
                          value={newPriority} 
                          onChange={e => setNewPriority(e.target.value)} 
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                        <select 
                          value={newCategory} 
                          onChange={e => setNewCategory(e.target.value)} 
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option>Auth</option>
                          <option>Interactive</option>
                          <option>Forms</option>
                          <option>General</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 transform hover:-translate-y-0.5"
                    >
                      <Send className="w-4 h-4" /> Create Task Pipeline
                    </button>
                  </form>
                </div>

                {/* Task list board */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-2xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-purple-500" /> Active Board Pipelines
                  </h3>

                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No tasks found. Select a quick spec template above to insert a task immediately.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {tasks.map((task) => {
                        const isSelected = selectedTaskId === task._id;
                        const isActive = !['Created', 'Success', 'Deployment Ready', 'Failed'].includes(task.status);
                        return (
                          <div 
                            key={task._id}
                            onClick={() => setSelectedTaskId(task._id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                              isSelected 
                                ? 'bg-purple-950/40 border-purple-500/50 shadow-neon-purple' 
                                : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                                {task.retries > 0 && (
                                  <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-950/40 border border-fuchsia-500/20 rounded-full px-2 py-0.5 animate-pulse">
                                    Retry {task.retries}/3
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                              <p className="text-xs text-slate-400 truncate">{task.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => runWorkflow(task._id)}
                                disabled={isActive}
                                className={`p-2 rounded-lg border transition-all ${
                                  isActive 
                                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-white/5' 
                                    : 'bg-purple-600/10 border-purple-500/30 text-purple-400 hover:bg-purple-600/20 shadow-sm'
                                }`}
                              >
                                {isActive ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                                )}
                              </button>
                              <button 
                                onClick={() => deleteTask(task._id)}
                                className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline & Sandbox (Right, Col-span 7) */}
              <div className="lg:col-span-7 space-y-6">
                {selectedTask ? (
                  <>
                    {/* Live Progress Timeline Component */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400">Current Phase Pipeline</span>
                          <h3 className="text-base font-bold text-white mt-0.5">Execution Stage Process</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusColor(selectedTask.status)}`}>
                            {selectedTask.status}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Horizontal Timeline Nodes */}
                      <div className="relative flex justify-between items-center w-full px-2">
                        {/* Connecting track line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
                        <div 
                          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
                          style={{ width: `${(Math.max(0, currentStageIdx) / (timelineStages.length - 1)) * 100}%` }}
                        ></div>

                        {timelineStages.map((stage, idx) => {
                          const isCompleted = idx < currentStageIdx;
                          const isActive = idx === currentStageIdx;
                          const isFailed = selectedTask.status === 'Failed' && idx === 4;

                          return (
                            <div key={stage.name} className="relative z-10 flex flex-col items-center">
                              {/* Glowing Node ring */}
                              <motion.div 
                                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                  isCompleted ? 'bg-gradient-to-tr from-purple-600 to-pink-500 border-purple-500 text-white shadow-neon-pink' :
                                  isFailed ? 'bg-rose-950 border-rose-500 text-rose-400 shadow-lg' :
                                  isActive ? 'bg-slate-900 border-purple-400 text-purple-300 shadow-neon-purple' :
                                  'bg-[#080315] border-slate-800 text-slate-500'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : isFailed ? (
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </motion.div>
                              <span className={`text-[10px] font-bold mt-2 text-center transition-all ${
                                isActive ? 'text-purple-300 glow-purple font-extrabold' : 
                                isCompleted ? 'text-slate-300' : 
                                'text-slate-600'
                              }`}>
                                {stage.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Twin Sandbox / failure viewer iframe panel */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-2xl relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Code className="text-purple-500 w-5 h-5" />
                          <h3 className="text-base font-bold text-white">Execution Output Preview</h3>
                        </div>
                        {selectedTask.screenshotUrl && (
                          <div className="flex p-0.5 bg-slate-950/80 rounded-lg border border-white/10 text-[11px] font-bold">
                            <button 
                              onClick={() => setViewMode('preview')} 
                              className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/20' : 'text-slate-400'}`}
                            >
                              Sandbox Preview
                            </button>
                            <button 
                              onClick={() => setViewMode('screenshot')} 
                              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'screenshot' ? 'bg-rose-600/30 text-rose-300 border border-rose-500/20 animate-pulse' : 'text-slate-400'}`}
                            >
                              <ImageIcon className="w-3 h-3" /> Failure Screenshot
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Display content frame */}
                      <div className="w-full h-80 rounded-xl bg-slate-950/80 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                        {viewMode === 'preview' && ['Success', 'Deployment Ready', 'Fixing Errors', 'Running Tests', 'Failed'].includes(selectedTask.status) && selectedTask.generatedFiles?.length > 0 ? (
                          <iframe 
                            src={`/preview/task-${selectedTask._id}/index.html?t=${Date.now()}`}
                            className="w-full h-full border-none bg-[#090514]"
                            title="Sandbox Preview"
                            key={selectedTask.status} // Forces reload on status changes!
                          />
                        ) : viewMode === 'screenshot' && selectedTask.screenshotUrl ? (
                          <div className="w-full h-full relative group">
                            <img 
                              src={`${selectedTask.screenshotUrl}?t=${Date.now()}`} 
                              alt="Playwright Failure Screenshot" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={`${selectedTask.screenshotUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800">
                                Open Full Size <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-6 text-slate-500 space-y-2">
                            <Cpu className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                            <p className="text-sm font-semibold">Sandbox is idle.</p>
                            <p className="text-xs text-slate-600 max-w-xs">Once you launch the task, the generated layout UI will load dynamically here in real-time.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl text-center py-16 text-slate-500">
                    Select or create an engineering task pipeline on the left panel to begin.
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Real-time Logs Console */}
            {selectedTask && (
              <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-2xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-500" /> Real-time Execution Console
                </h3>

                <div className="w-full h-60 bg-black/70 font-mono text-xs rounded-xl p-4 overflow-y-auto border border-white/5 flex flex-col gap-1.5 scroll-smooth">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 italic">No output logs received yet. Click the run icon above to spin up the agent pipeline.</div>
                  ) : (
                    logs.map((log, idx) => {
                      let logColor = 'text-slate-300';
                      if (log.type === 'error') logColor = 'text-rose-400 font-bold';
                      else if (log.type === 'warning') logColor = 'text-amber-400';
                      else if (log.type === 'success') logColor = 'text-emerald-400 font-semibold';
                      
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="text-slate-600 select-none text-[10px] mt-0.5">{log.timestamp}</span>
                          <span className={`${logColor} whitespace-pre-wrap flex-1`}>
                            {log.message}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Service Settings page */
          <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" /> Service Settings
              </h3>
              <p className="text-xs text-slate-400 mb-6">Manage API keys and environmental configurations for the autonomous platform.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" /> OpenAI API Authorization Key
                  </label>
                  <input 
                    type="password" 
                    disabled={true}
                    value="••••••••••••••••••••••••••••" 
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    For local safety, update the `OPENAI_API_KEY` directly inside the `.env` configuration file in the project directory.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-purple-500/10 bg-purple-950/15">
                  <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Simulation mode is active by default
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    If no API key is specified inside `.env`, the pipeline runs using local templates. For example, testing the <b>Login form validation</b> or <b>Todo application</b> will trigger genuine errors in Playwright tests (such as missing validation logic or un-cleared inputs), capture failing screenshots, feed the error logs back into the AI Agent mock service, and write fully healed code which subsequently passes on retry 1/2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
