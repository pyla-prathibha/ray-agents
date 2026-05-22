// In-memory store for live webhook events per call_id
// The UI polls GET /api/calls/events?call_id=xxx to get live updates

export interface CallEvent {
  event_type: string;
  timestamp: string;
  status?: string;
  sub_status?: string;
  call_duration?: number;
  transcript?: { bot?: string; user?: string }[];
  recording_url?: string;
  platform_analysis?: Record<string, unknown>;
  client_analysis?: Record<string, unknown>;
  claude_analysis?: Record<string, unknown>;
  raw_payload?: Record<string, unknown>;
}

export interface CallState {
  call_id: string;
  agent_type: string;
  status: "initiated" | "ringing" | "connected" | "completed" | "failed" | "voicemail";
  events: CallEvent[];
  created_at: string;
}

const callStore = new Map<string, CallState>();

export function createCall(callId: string, agentType: string): CallState {
  const state: CallState = {
    call_id: callId,
    agent_type: agentType,
    status: "initiated",
    events: [],
    created_at: new Date().toISOString(),
  };
  callStore.set(callId, state);
  return state;
}

export function addEvent(callId: string, event: CallEvent): void {
  const state = callStore.get(callId);
  if (state) {
    state.events.push(event);

    // Update call status based on event
    if (event.event_type === "call_started") {
      state.status = event.sub_status === "ACCEPTED" ? "connected" : "ringing";
    } else if (event.event_type === "call_completed") {
      if (event.sub_status === "VOICEMAIL_DETECTED" || event.sub_status === "VOICEMAIL_DETECTED_VIA_LLM") {
        state.status = "voicemail";
      } else if (event.status === "completed") {
        state.status = "completed";
      } else {
        state.status = "failed";
      }
    } else if (event.event_type === "all_processing_completed") {
      // Keep existing status (completed/voicemail/failed)
    }
  } else {
    // Event for unknown call — create a new state
    const newState = createCall(callId, "outbound");
    newState.events.push(event);
  }
}

export function getCallState(callId: string): CallState | undefined {
  return callStore.get(callId);
}

export function getRecentCalls(limit = 20): CallState[] {
  return Array.from(callStore.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}
