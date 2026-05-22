import { config } from "@/config";

export function validateWebhookAuth(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === config.webhook.receiverToken;
}
