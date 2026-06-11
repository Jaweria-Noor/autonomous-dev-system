# Autonomous Healing Loop - MCP Powered AI Development System

## Overview

Autonomous Healing Loop is an AI-powered software development platform built on the **Model Context Protocol (MCP)**. The system enables AI agents to generate code, execute automated tests, analyze failures, perform self-healing, and create Jira issues through dedicated MCP servers.

The platform combines **Gemini AI**, **MCP**, **Playwright**, and **Jira** to create an autonomous development workflow that can identify issues, attempt fixes, validate solutions, and escalate unresolved problems automatically.

---

## Key Features

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

---

## Architecture

```text
+-------------------------+
|      Gemini AI Agent    |
+------------+------------+
             |
             | MCP RPC
             v
+-------------------------+
|       MCP Client        |
+------------+------------+
             |
    +--------+--------+
    |                 |
    v                 v

+----------------+   +----------------------+
| Jira MCP Server|   | Playwright MCP Server|
+-------+--------+   +----------+-----------+
        |                       |
        v                       v

+---------------+    +----------------------+
| Jira Platform |    | Playwright Test Suite|
+---------------+    +----------------------+
```

---

## Project Structure

```text
autonomous-dev-system/
│
├── backend/
│   ├── mcp/
│   │   ├── jira-server.js
│   │   └── playwright-server.js
│   │
│   ├── services/
│   ├── routes/
│   ├── runner.js
│   └── server.js
│
├── frontend/
│   ├── src/
│   └── public/
│
├── generated-code/
├── playwright-tests/
├── screenshots/
├── logs/
├── data/
├── scripts/
│
├── .env
├── package.json
└── README.md
```

---

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

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Jaweria-Noor/autonomous-dev-system.git
cd autonomous-dev-system
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key
MONGODB_URI=your_mongodb_connection_string

JIRA_BASE_URL=your_jira_url
JIRA_EMAIL=your_email
JIRA_API_TOKEN=your_token
```

---

## Running the Project

### Development Mode

```bash
npm run dev
```

This starts:

* Backend Server
* MCP Servers
* Frontend Dashboard

---

## Future Enhancements

* Multi-Agent Collaboration
* GitHub MCP Server Integration
* CI/CD Automation
* Advanced Code Review Agents
* Cloud Deployment Pipelines
* Additional MCP Tool Servers

---

## License

MIT License

---

## Author

Jaweria Noor

Built as an experimental MCP-powered autonomous software development platform demonstrating AI agents, self-healing workflows, automated testing, and tool orchestration through the Model Context Protocol.
