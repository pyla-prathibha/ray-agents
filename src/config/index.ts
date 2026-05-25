export const config = {
  anthropic: {
    oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.CLAUDE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY || "",
    model: "claude-haiku-4-5" as const,
  },
  ringai: {
    apiKey: process.env.RINGG_API_KEY || "",
    baseUrl: "https://prod-api.ringg.ai/ca/api/v0",
    inboundAgentId: "4d03f9cd-320b-49bf-adbb-cbe8fdde9c59",
    inboundNumber: "+918031137408",
    // Post Booking Call Agent
    postOpdAgentId: "009fb2be-37bd-441b-aaa5-94c2a1946cad",
    postOpdFromNumberId: "ffc7dd03-3a4d-46ef-9aab-5aba0699ad36",
    postOpdFromNumber: "+912268095634",
    // Patient Reactivation Agent
    reactivationAgentId: "60c6b2d5-46ca-4b4f-975a-c31f23cf8c3d",
    reactivationFromNumberId: "ffc7dd03-3a4d-46ef-9aab-5aba0699ad36",
    reactivationFromNumber: "+912268095634",
  },
  practo: {
    bearerToken: process.env.PRACTO_BEARER_TOKEN || "",
    baseUrl: "https://bridge.practo.com/api/v1",
  },
  webhook: {
    receiverToken: process.env.WEBHOOK_RECEIVER_TOKEN || "dev-token",
  },
} as const;
