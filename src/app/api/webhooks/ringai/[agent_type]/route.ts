import { NextRequest, NextResponse } from "next/server";
import { validateWebhookAuth } from "@/middlewares/auth";
import { handleInboundEvent } from "@/agents/inbound/handler";
import { handleOutboundEvent } from "@/agents/outbound/handler";
import type { RingAIWebhookPayload } from "@/types";

const processedEvents = new Set<string>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent_type: string }> }
) {
  const { agent_type } = await params;

  const authHeader = request.headers.get("authorization");
  if (!validateWebhookAuth(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: RingAIWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dedupeKey = `${payload.call_id}:${payload.event_type}`;
  if (processedEvents.has(dedupeKey)) {
    return new NextResponse(null, { status: 204 });
  }
  processedEvents.add(dedupeKey);

  // Acknowledge immediately (RingAI expects 200 within 30s)
  const response = NextResponse.json({ received: true }, { status: 200 });

  // Route to agent handler asynchronously
  if (agent_type === "inbound") {
    handleInboundEvent(payload).catch(console.error);
  } else if (agent_type === "outbound") {
    handleOutboundEvent(payload).catch(console.error);
  }

  return response;
}
