const { default: Anthropic } = require("@anthropic-ai/sdk");

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


module.exports = { generateAISubtasks }