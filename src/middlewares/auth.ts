import { config } from "@/config";

export function validateWebhookAuth(authHeader: string | null): boolean {
  if (!authHeader) return false;
  // Normalize both by stripping "Bearer " and trimming whitespace
  const token = authHeader.replace("Bearer ", "").trim();
  const configuredToken = config.webhook.receiverToken.replace("Bearer ", "").trim();
  return token === configuredToken;
}

