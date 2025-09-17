const { Client } = require("@modelcontextprotocol/sdk/client");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

const mcpClient = new Client(
  {
    name: "task-management-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

let isConnected = false;
async function connectToMCP() {
  try {
    // Connect to our MCP server via stdio
    const transport = new StdioClientTransport({
      command: "node",
      args: [path.join(__dirname, "../mcp/taskMCPServer.js")],
    });

    await mcpClient.connect(transport);
    isConnected = true;

    console.log("✅ Connected to MCP Server");

    // Log available tools
    const tools = await getAvailableTools();
    console.log(
      "📋 Available MCP Tools:",
      tools.map((t) => t.name)
    );

    return true;
  } catch (error) {
    console.error("❌ MCP Connection Error:", error);
    isConnected = false;
    return false;
  }
}

async function getAvailableTools() {
  if (!isConnected) {
    throw new Error("MCP not connected");
  }

  const result = await mcpClient.listTools();
  return result.tools;
}

async function callTool(toolName, args) {
  if (!isConnected) {
    throw new Error("MCP not connected");
  }

  const result = await mcpClient.callTool({
    name: toolName,
    arguments: args,
  });

  return JSON.parse(result.content[0].text);
}

async function disconnectFromMCP() {
  if (mcpClient && isConnected) {
    await mcpClient.close();
    isConnected = false;
    console.log("🔌 Disconnected from MCP Server");
  }
}

function isMCPConnected() {
  return isConnected;
}

module.exports = {
  connectToMCP,
  getAvailableTools,
  callTool,
  disconnectFromMCP,
  isMCPConnected,
};
