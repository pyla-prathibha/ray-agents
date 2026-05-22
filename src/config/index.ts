export const config = {
  anthropic: {
    oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.CLAUDE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY || "",
    model: "claude-sonnet-4-6" as const,
  },
  ringai: {
    apiKey: process.env.RINGG_API_KEY || "",
    baseUrl: "https://prod-api.ringg.ai/ca/api/v0",
    inboundAgentId: "4d03f9cd-320b-49bf-adbb-cbe8fdde9c59",
    inboundNumber: "+918031137408",
    outboundAgentId: "35b9bb7d-c4ea-45eb-95c6-cc31f83e008f",
    fromNumberId: "ffc7dd03-3a4d-46ef-9aab-5aba0699ad36",
    fromNumber: "+912268095634",
  },
  practo: {
    bearerToken: process.env.PRACTO_BEARER_TOKEN || "",
    baseUrl: "https://bridge.practo.com/api/v1",
  },
  webhook: {
    receiverToken: process.env.WEBHOOK_RECEIVER_TOKEN || "dev-token",
  },
} as const;
