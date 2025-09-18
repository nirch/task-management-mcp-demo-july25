const { default: Anthropic } = require("@anthropic-ai/sdk");
const {
  connectToMCP,
  getAvailableTools,
  callTool,
  isMCPConnected,
} = require("./mcpClientService");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateAISubtasks(title, description = "") {
  try {
    const prompt = `Given this task: "${title}"${
      description ? ` - ${description}` : ""
    }, suggest 3 specific, actionable subtasks that would help complete it. Respond with only a JSON array of strings, no other text.

Example format: ["subtask 1", "subtask 2", "subtask 3"]`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log(response);
    const aiText = response.content[0].text.trim();
    const subtasks = JSON.parse(aiText);

    return subtasks;
  } catch (err) {
    console.error("AI Service Error: ", err);
    return [];
  }
}

async function initializeMCP() {
  return await connectToMCP();
}

async function chatWithMCPTools(userMessage, userId) {
  if (!isMCPConnected()) {
    return "I'm having trouble connecting to my tools right now. Please try again later.";
  }

  // Get Tools (MCP Server)
  const tools = await getAvailableTools();

  const claudeTools = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));

  // Send Claude Tools + userMessage
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    tools: claudeTools,
    tool_choice: { type: "auto" }, // Let Claude decide
    messages: [
      {
        role: "user",
        content: `I need help with my tasks. My user ID is ${userId}. ${userMessage}`,
      },
    ],
  });

  let finalResult = "";
  const toolResults = [];

  // Call Tools (MCP Server)
  for (const content of response.content) {
    if (content.type === "text") {
      finalResult += content.text;
    } else if (content.type === "tool_use") {
      console.log(`Claude is using tool: ${content.name}`);

      const toolResult = await callTool(content.name, content.input);
      toolResults.push({
        tool_use_id: content.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  // Send Claude Tool results (context) + userMessage
  if (toolResults.length > 0) {
    const followUpResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `I need help with my tasks. My user ID is ${userId}. ${userMessage}`,
        },
        {
          role: "assistant",
          content: response.content,
        },
        {
          role: "user",
          content: toolResults.map((result) => ({
            type: "tool_result",
            tool_use_id: result.tool_use_id,
            content: result.content,
          })),
        },
      ],
    });


    // Send final response
    return followUpResponse.content[0].text;
  } else {
    return finalResult;
  }



}

module.exports = { generateAISubtasks, initializeMCP, chatWithMCPTools };
