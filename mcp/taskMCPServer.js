const { Server } = require("@modelcontextprotocol/sdk/server");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const server = new Server(
  { name: "task-assistant", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List Tools
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


// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "analyze_tasks":
        const analysis = await analyzeUserTasks(args.userId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis),
            },
          ],
        };

      case "get_overdue_tasks":
        const overdueTasks = await getOverdueTasks(args.userId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(overdueTasks),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: error.message }),
        },
      ],
    };
  }
});

async function getOverdueTasks(userId) {
  const now = new Date();
  const overdueTasks = await Task.find({
    userId,
    dueDate: { $lt: now },
    status: { $ne: "completed" },
  });

  return {
    count: overdueTasks.length,
    tasks: overdueTasks.map((task) => ({
      title: task.title,
      dueDate: task.dueDate,
      daysOverdue: Math.ceil((now - task.dueDate) / (1000 * 60 * 60 * 24)),
      status: task.status,
    })),
  };
}

async function analyzeUserTasks(userId) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all user tasks
  const allTasks = await Task.find({ userId });

  // Task counts by status
  const tasksByStatus = {
    pending: allTasks.filter((t) => t.status === "pending").length,
    "in-progress": allTasks.filter((t) => t.status === "in-progress").length,
    completed: allTasks.filter((t) => t.status === "completed").length,
  };

  // Recent activity
  const recentTasks = allTasks.filter((t) => t.createdAt >= oneWeekAgo);
  const completedThisWeek = allTasks.filter(
    (t) => t.status === "completed" && t.updatedAt >= oneWeekAgo
  );

  // Calculate insights
  const totalTasks = allTasks.length;
  const completionRate =
    totalTasks > 0
      ? Math.round((tasksByStatus.completed / totalTasks) * 100)
      : 0;

  return {
    summary: {
      totalTasks,
      tasksByStatus,
      completionRate,
    },
    recentActivity: {
      tasksCreatedThisWeek: recentTasks.length,
      tasksCompletedThisWeek: completedThisWeek.length,
    },
    insights: {
      mostCommonStatus:
        Object.entries(tasksByStatus).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "none",
      isActiveThisWeek: recentTasks.length > 0,
    },
  };
}

if (require.main === module) {
  const mongoose = require("mongoose");
  const dotenv = require("dotenv");

  dotenv.config();

  async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    await startMCPServer();
  }

  main().catch(console.error);
}

async function startMCPServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Real MCP Server connected via stdio");
}


module.exports = { server, startMCPServer };
