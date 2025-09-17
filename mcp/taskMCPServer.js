const { Server } = require("@modelcontextprotocol/sdk/server");
const {
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const server = new Server(
  { name: "task-assistant", version: "1.0.0" },
  { capabilities: { tools: {} } }
);


server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_tasks",
      description:
        "Analyze user task patterns, completion rates, and provide productivity insights",
      inputSchema: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID to analyze tasks for",
          },
        },
        required: ["userId"],
      },
    },
    {
      name: "get_overdue_tasks",
      description: "Get list of overdue tasks that need immediate attention",
      inputSchema: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID to check for overdue tasks",
          },
        },
        required: ["userId"],
      },
    },
  ],
}));
