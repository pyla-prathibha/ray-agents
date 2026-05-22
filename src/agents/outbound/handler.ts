import type { RingAIWebhookPayload } from "@/types";
import { addEvent } from "@/services/callEventStore";
import { callClaude } from "@/services/claude";

const OUTBOUND_SYSTEM_PROMPT = `You are the Ray AI Post-OPD Follow-Up Analyst.
You will receive a call transcript between an AI agent and a patient who recently had an OPD dental consultation.

Analyze the transcript and return ONLY valid JSON (no markdown, no code fences) matching this schema:
{
  "classification": "follow_up_booked" | "interested_not_booked" | "not_interested" | "voicemail" | "incomplete",
  "patient_sentiment": "positive" | "neutral" | "negative",
  "follow_up_booked": boolean,
  "appointment_details": {
    "date": string | null,
    "time": string | null,
    "doctor": string | null
  },
  "key_concerns": string[],
  "recommended_action": string,
  "summary": string
}`;

export async function handleOutboundEvent(
  payload: RingAIWebhookPayload
): Promise<void> {
  const callId = payload.call_id;
  const eventType = payload.event_type;
  const now = new Date().toISOString();

  console.log(`[Outbound] Processing ${eventType} for call ${callId}`);

  // Store event in call event store
  addEvent(callId, {
    event_type: eventType,
    timestamp: now,
    status: payload.status,
    sub_status: payload.sub_status,
    call_duration: (payload as unknown as Record<string, unknown>).call_duration as number | undefined,
    transcript: payload.transcript as { bot?: string; user?: string }[],
    recording_url: payload.recording_url,
    platform_analysis: payload.platform_analysis as Record<string, unknown> | undefined,
    client_analysis: payload.client_analysis as Record<string, unknown> | undefined,
    raw_payload: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>,
  });

  // Handle specific event types
  if (eventType === "call_started") {
    console.log(`[Outbound] Call ${callId} started — sub_status: ${payload.sub_status}`);
  }

  if (eventType === "call_completed") {
    const subStatus = payload.sub_status;
    console.log(`[Outbound] Call ${callId} completed — status: ${payload.status}, sub_status: ${subStatus}`);

    if (subStatus === "VOICEMAIL_DETECTED" || subStatus === "VOICEMAIL_DETECTED_VIA_LLM") {
      console.log(`[Outbound] Voicemail detected for call ${callId}. Retry count: ${payload.retry_count}`);
    }
  }

  if (eventType === "all_processing_completed") {
    console.log(`[Outbound] All processing completed for call ${callId}`);

    // Run Claude analysis on the transcript
    if (payload.transcript && payload.transcript.length > 0) {
      try {
        const transcriptText = payload.transcript
          .map((turn) => {
            if ("bot" in turn) return `AI Agent: ${(turn as Record<string, string>).bot}`;
            if ("user" in turn) return `Patient: ${(turn as Record<string, string>).user}`;
            if ("role" in turn) return `${turn.role}: ${turn.content}`;
            return JSON.stringify(turn);
          })
          .join("\n");

        console.log(`[Outbound] Running Claude analysis on transcript (${payload.transcript.length} turns)`);

        const rawResponse = await callClaude(
          OUTBOUND_SYSTEM_PROMPT,
          `Patient: ${payload.custom_args_values?.patient_name || "Unknown"}\nDoctor: ${payload.custom_args_values?.doctor_name || "Unknown"}\nSpecialty: ${payload.custom_args_values?.doctor_specialty || "Unknown"}\n\nTranscript:\n${transcriptText}`
        );

        const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const analysis = JSON.parse(cleaned);

        console.log(`[Outbound] Claude analysis result:`, JSON.stringify(analysis, null, 2));

        // Store Claude analysis in the event
        addEvent(callId, {
          event_type: "claude_analysis_completed",
          timestamp: new Date().toISOString(),
          claude_analysis: analysis,
        });
      } catch (error) {
        console.error(`[Outbound] Claude analysis failed for call ${callId}:`, error);
      }
    } else {
      console.log(`[Outbound] No transcript available for call ${callId} — skipping Claude analysis`);
    }
  }
}
