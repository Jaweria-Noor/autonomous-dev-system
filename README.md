# Autonomous Healing Loop - MCP Powered AI Development System

## Overview

<<<<<<< HEAD
Autonomous Healing Loop is an AI-powered software development platform built on the **Model Context Protocol (MCP)**. The system enables AI agents to generate code, execute automated tests, analyze failures, perform self-healing, and create Jira issues through dedicated MCP servers.

The platform combines **Gemini AI**, **MCP**, **Playwright**, and **Jira** to create an autonomous development workflow that can identify issues, attempt fixes, validate solutions, and escalate unresolved problems automatically.
=======
Autonomous Healing Loop is an AI-powered software development platform built on the **Model Context Protocol (MCP)**. The system enables AI agents to generate code, execute automated tests, analyze failures, perform self‑healing, and create Jira issues through dedicated MCP servers.
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)

---

## Key Features

<<<<<<< HEAD
### MCP-Based Tool Architecture

* Built using the official Model Context Protocol (MCP) SDK
* Dedicated Jira MCP Server
* Dedicated Playwright MCP Server
* Structured tool discovery and invocation
* RPC-based communication using STDIO transport

### AI-Powered Code Generation

* Generates application code from task descriptions
* Supports iterative development workflows
* AI-driven implementation planning

### Automated Testing

* Executes Playwright test suites
* Runs UI validation automatically
* Captures test results and execution logs

### Autonomous Self-Healing

* Detects test failures
* Collects debugging context
* Captures screenshots and diagnostics
* Generates fixes using Gemini AI
* Applies fixes and re-runs validation tests

### Jira Integration

* Creates bugs automatically for unresolved issues
* Supports Epic, Story, and Bug creation
* Tracks development and testing failures

### Monitoring Dashboard

* React-based frontend
* Real-time workflow visibility
* Task execution monitoring
* Development lifecycle tracking
=======
### MCP‑Based Tool Architecture
- Official MCP SDK (`@modelcontextprotocol/sdk`)
- Dedicated Jira MCP Server
- Dedicated Playwright MCP Server
- Structured tool discovery and validation using JSON‑Schema
- RPC communication via STDIO transport

### AI‑Powered Code Generation
- Generates application code from task descriptions
- Iterative development workflows
- Implementation planning using Gemini 2.5 Flash

### Automated Testing
- Executes Playwright test suites
- Captures screenshots, traces and logs
- Provides deterministic test results

### Autonomous Self‑Healing
- Detects test failures
- Collects debugging context (error logs, screenshot, trace, generated source)
- Generates fixes with Gemini AI (`AIService.generateFix()`)
- Applies fixes directly to source files and re‑runs validation

### Jira Integration
- Automatic bug creation for unresolved issues
- Supports Epic, Story, and Bug creation via MCP tools
- Tracks development and testing failures

### Monitoring Dashboard
- React + Vite frontend
- Real‑time workflow visibility
- Task execution monitoring and lifecycle tracking
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)

---



## Project Structure

```text
autonomous-dev-system/
│
├── backend/
│   ├── mcp/
<<<<<<< HEAD
│   │   ├── jira-server.js
│   │   └── playwright-server.js
│   │
│   ├── services/
│   ├── routes/
│   ├── runner.js
│   └── server.js
=======
│   │   ├── jira-server.js          # Jira MCP implementation
│   │   └── playwright-server.js    # Playwright MCP implementation
│   ├── services/
│   │   ├── memoryService.js        # MongoDB persistence layer
│   │   ├── plannerService.js       # Task planning module
│   │   └── toolRegistry.js         # MCP tool schema registry & validator
│   ├── sandbox/
│   │   └── sandboxRunner.js        # vm2‑based isolated code execution
│   ├── runner.js                  # Orchestrates the 8‑step pipeline
│   └── server.js                  # Express API entry point
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)
│
├── frontend/
│   ├── src/
│   └── public/
│
<<<<<<< HEAD
├── generated-code/
├── playwright-tests/
├── screenshots/
├── logs/
├── data/
├── scripts/
│
├── .env
=======
├── generated-code/                # AI‑generated source files
├── playwright-tests/              # Playwright test suites
├── screenshots/                   # Runtime UI screenshots
├── logs/                          # Execution logs
├── data/                          # Temporary data files
├── .env                           # Environment configuration (MongoDB, Gemini, Jira)
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)
├── package.json
└── README.md
```

---

<<<<<<< HEAD
## Technology Stack

### Backend

* Node.js
* Express.js
* JavaScript

### Frontend

* React
* Vite

### AI & Automation

* Gemini AI
* Playwright

### MCP Infrastructure

* Model Context Protocol (MCP)
* @modelcontextprotocol/sdk
* MCP Server Architecture
* STDIO Transport

### Integrations

* Jira
* MongoDB

---

## MCP Servers

### Jira MCP Server

Exposes the following MCP tools:

* `create_epic`
* `create_story`
* `create_bug`

Responsible for:

* Issue creation
* Project tracking
* Workflow management

### Playwright MCP Server

Exposes the following MCP tools:

* `run_test`
* `take_screenshot`
* `get_test_results`
* `get_trace`

Responsible for:

* Test execution
* Diagnostics collection
* Failure analysis
* Screenshot generation

---

## Self-Healing Workflow

1. User submits a development task.
2. Gemini AI generates code.
3. Playwright MCP Server executes tests.
4. If a test fails:

   * Logs are collected
   * Screenshots are captured
   * Diagnostics are generated
5. Gemini AI analyzes the failure.
6. AI generates a fix.
7. The fix is applied automatically.
8. Tests are re-executed.
9. If the issue persists:

   * Jira MCP Server creates a bug ticket.
10. Final artifacts are prepared for deployment.
=======
## New Modules (Production‑Grade Enhancements)

### 1. Memory Layer (MongoDB)
- **File:** `backend/services/memoryService.js`
- Persists failures, error messages, generated fixes, timestamps, resolution status and related Jira ticket IDs.
- Before generating a fix, the AI queries this store to reuse successful past strategies and avoid duplicate repair loops.

### 2. Task Planner
- **File:** `backend/services/plannerService.js`
- Generates a deterministic step‑by‑step plan for each task (e.g., code generation → test → heal → verify).
- Enforces planning before execution, improving reproducibility and auditability.

### 3. Structured MCP Tool Registry
- **Files:** `backend/mcp/toolRegistry.js` & `backend/mcp/toolValidator.js`
- Registers all MCP tools with JSON‑Schema definitions.
- Validates tool calls at runtime using `ajv`, preventing malformed requests.

### 4. Execution Sandboxing
- **File:** `backend/sandbox/sandboxRunner.js`
- Runs AI‑generated code inside a `vm2` sandbox, isolating file‑system access and preventing arbitrary process spawning.
- Guarantees safe execution of untrusted code.
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)

---

## Installation

### Clone Repository

```bash
<<<<<<< HEAD
git clone https://github.com/Jaweria-Noor/autonomous-dev-system.git
=======
git clone https://github.com/YOUR_USERNAME/autonomous-dev-system.git
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)
cd autonomous-dev-system
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables
<<<<<<< HEAD

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key
MONGODB_URI=your_mongodb_connection_string

JIRA_BASE_URL=your_jira_url
JIRA_EMAIL=your_email
JIRA_API_TOKEN=your_token
=======
Create a `.env` file with the following keys:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
JIRA_BASE_URL=your_jira_instance_url
JIRA_EMAIL=your_email
JIRA_API_TOKEN=your_jira_api_token
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)
```

---

## Running the Project

### Development Mode

```bash
npm run dev
```

This starts:
<<<<<<< HEAD

* Backend Server
* MCP Servers
* Frontend Dashboard
=======
- Backend server (`node server.js`)
- MCP servers (Jira & Playwright)
- Frontend dashboard (Vite)
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)

---

## Future Enhancements

<<<<<<< HEAD
* Multi-Agent Collaboration
* GitHub MCP Server Integration
* CI/CD Automation
* Advanced Code Review Agents
* Cloud Deployment Pipelines
* Additional MCP Tool Servers
=======
- Multi‑agent collaboration
- GitHub MCP server integration
- CI/CD automation
- Advanced code‑review agents
- Cloud deployment pipelines
- Additional MCP tool servers
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)

---

## License

MIT License

---

## Author

Jaweria Noor

<<<<<<< HEAD
Built as an experimental MCP-powered autonomous software development platform demonstrating AI agents, self-healing workflows, automated testing, and tool orchestration through the Model Context Protocol.
=======
Built as an experimental MCP‑powered autonomous software development platform demonstrating AI agents, self‑healing workflows, automated testing, and tool orchestration through the Model Context Protocol.
>>>>>>> 2d4fb8bb (Updated autonomous dev system with MCP + Gemini integration)
