import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MCPClient {
  constructor(serverScriptPath) {
    this.serverScriptPath = serverScriptPath;
    this.client = new Client({ name: "aetherdev-mcp-client", version: "1.0.0" }, { capabilities: {} });
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    
    // The command runs node on the specified server script
    const transport = new StdioClientTransport({
      command: "node",
      args: [this.serverScriptPath]
    });
    
    await this.client.connect(transport);
    this.connected = true;
  }

  async callTool(name, args) {
    await this.connect();
    const result = await this.client.callTool({
      name,
      arguments: args
    });
    if (result.isError) {
      throw new Error(result.content[0].text);
    }
    
    try {
      // If the text is JSON, parse it for easier use
      return JSON.parse(result.content[0].text);
    } catch (e) {
      return result.content[0].text;
    }
  }

  async listTools() {
    await this.connect();
    return await this.client.listTools();
  }
}

// Singletons for the servers
export const JiraMCP = new MCPClient(path.resolve(__dirname, "./jira-server.js"));
export const PlaywrightMCP = new MCPClient(path.resolve(__dirname, "./playwright-server.js"));
