import { config } from "@/config";

const BASE_URL = config.ringai.baseUrl;

function headers() {
  return {
    "X-API-KEY": config.ringai.apiKey,
    "Content-Type": "application/json",
  };
}

export interface InitiateCallParams {
  patientName: string;
  mobileNumber: string; // E.164 format e.g. +919876543210
  customArgs: Record<string, string>;
}

export interface InitiateCallResponse {
  call_id: string;
  call_status: string;
  agent_id: string;
}

export async function initiateOutboundCall(
  params: InitiateCallParams
): Promise<InitiateCallResponse> {
  const body = {
    name: params.patientName,
    mobile_number: params.mobileNumber,
    agent_id: config.ringai.outboundAgentId,
    from_number_id: config.ringai.fromNumberId,
    custom_args_values: {
      callee_name: params.patientName,
      mobile_number: params.mobileNumber,
      // Required agent-configured args with sensible defaults
      clinic_name: "Dr. Victor Mag's Dental Clinic",
      months_since_visit: "3",
      past_condition: "General Dental Consultation",
      cohort_trigger: "Post-OPD Follow-up",
      new_offer_text: "Complimentary dental check-up for returning patients",
      last_visit_date: new Date().toISOString().split("T")[0],
      specific_test: "Dental X-Ray",
      screening_type: "Comprehensive Oral Health Screening",
      screening_price: "Free for returning patients",
      callback_time: "10:00 AM - 6:00 PM",
      ...params.customArgs,
    },
    call_config: {
      call_retry_config: {
        retry_count: 2,
        retry_busy: 5,
        retry_not_picked: 5,
        retry_failed: 10,
      },
      max_call_length: 300,
      idle_timeout_warning: 5,
      idle_timeout_end: 10,
    },
  };

  console.log(`[RingAI] Initiating outbound call to ${params.mobileNumber} via agent ${config.ringai.outboundAgentId}`);

  const res = await fetch(`${BASE_URL}/calling/outbound/individual`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RingAI call initiation failed (${res.status}): ${errText}`);
  }

  const json = await res.json();
  console.log(`[RingAI] Call initiated — call_id: ${json.data?.call_id}`);
  return json.data;
}

export async function registerWebhookSubscription(
  callbackUrl: string,
  webhookToken: string
): Promise<void> {
  const body = {
    operation: "edit_event_subscriptions",
    agent_id: config.ringai.outboundAgentId,
    event_subscriptions: [
      {
        event_type: [
          "call_started",
          "call_completed",
          "all_processing_completed",
        ],
        callback_url: callbackUrl,
        headers: {
          Authorization: `Bearer ${webhookToken}`,
          "Content-Type": "application/json",
        },
        method_type: "POST",
      },
    ],
  };

  console.log(`[RingAI] Registering webhook subscription → ${callbackUrl}`);

  const res = await fetch(`${BASE_URL}/agent/v1`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RingAI webhook registration failed (${res.status}): ${errText}`);
  }

  console.log("[RingAI] Webhook subscription registered successfully");
}
