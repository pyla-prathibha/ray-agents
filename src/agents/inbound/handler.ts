import type { RingAIWebhookPayload } from "@/types";

export async function handleInboundEvent(
  payload: RingAIWebhookPayload
): Promise<void> {
  console.log(
    `[Inbound] Processing ${payload.event_type} for call ${payload.call_id}`
  );

  if (payload.event_type === "all_processing_completed" && payload.transcript) {
    // Phase 2: Claude parses transcript -> extract intent, date, time
    // -> Call Booking API -> Send WhatsApp confirmation
    console.log("[Inbound] Transcript received, Claude pipeline would run here");
  }
}
