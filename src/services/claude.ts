import path from "path";
import { config } from "@/config";

export async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const { query } = await import("@anthropic-ai/claude-agent-sdk");

  const claudePath =
    process.env.CLAUDE_EXECUTABLE_PATH ||
    path.join(
      process.cwd(),
      "node_modules/@anthropic-ai/claude-agent-sdk-darwin-arm64/claude"
    );

  const responseParts: string[] = [];

  for await (const message of query({
    prompt: userMessage,
    options: {
      model: config.anthropic.model,
      systemPrompt,
      allowedTools: [],
      permissionMode: "bypassPermissions",
      maxTurns: 1,
      pathToClaudeCodeExecutable: claudePath,
    },
  })) {
    if (
      message.type === "assistant" &&
      message.message?.content
    ) {
      for (const block of message.message.content) {
        if ("text" in block && block.type === "text") {
          responseParts.push(block.text);
        }
      }
    }

    if (message.type === "result") {
      const resultMsg = message as Record<string, unknown>;
      const cost = (resultMsg.total_cost_usd as number) || 0;
      console.log(
        `[Claude] Done — $${cost.toFixed(4)} cost`
      );
    }
  }

  const fullResponse = responseParts.join("");
  if (!fullResponse) {
    throw new Error("No text response from Claude");
  }
  return fullResponse;
}
