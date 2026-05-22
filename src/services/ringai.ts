import { config } from "@/config";

const BASE_URL = config.ringai.baseUrl;

function headers() {
  return {
    "X-API-KEY": config.ringai.apiKey,
    "Content-Type": "application/json",
  };
}

export type OutboundAgentType = "post-opd" | "reactivation";

export interface InitiateCallParams {
  patientName: string;
  mobileNumber: string;
  agentType: OutboundAgentType;
  customArgs?: Record<string, string>;
}

export interface InitiateCallResponse {
  call_id: string;
  call_status: string;
  agent_id: string;
}

const AGENT_CONFIG: Record<OutboundAgentType, { agentId: string; fromNumberId: string }> = {
  "post-opd": {
    agentId: config.ringai.postOpdAgentId,
    fromNumberId: config.ringai.postOpdFromNumberId,
  },
  reactivation: {
    agentId: config.ringai.reactivationAgentId,
    fromNumberId: config.ringai.reactivationFromNumberId,
  },
};

function buildCustomArgs(params: InitiateCallParams): Record<string, string> {
  const common = {
    callee_name: params.patientName,
    mobile_number: params.mobileNumber,
  };

  if (params.agentType === "post-opd") {
    // Post OPD agent requires these specific args
    return {
      ...common,
      patient_id: "PAT-001",
      patient_name: params.patientName,
      doctor_name: params.customArgs?.doctor_name || "Dr. Victor Mag",
      doctor_specialty: params.customArgs?.doctor_specialty || "Dentist",
      appointment_date: new Date().toISOString().split("T")[0],
      appointment_time: "10:30",
      scheduler_appointment_id: "SCH-001",
      appointment_id: "APT-001",
      doctor_reference_id: "DREF-001",
      practice_reference_id: "PREF-001",
      doctor_id: "DOC-001",
      practice_id: "PRC-001",
      ...params.customArgs,
    };
  }

  // Reactivation agent requires these args
  return {
    ...common,
    clinic_name: "Dr. Victor Mag's Dental Clinic",
    months_since_visit: "3",
    past_condition: "General Dental Consultation",
    cohort_trigger: "Dormant Patient Reactivation",
    new_offer_text: "Complimentary dental check-up for returning patients",
    last_visit_date: new Date().toISOString().split("T")[0],
    specific_test: "Dental X-Ray",
    screening_type: "Comprehensive Oral Health Screening",
    screening_price: "Free for returning patients",
    callback_time: "10:00 AM - 6:00 PM",
    ...params.customArgs,
  };
}

export async function initiateOutboundCall(
  params: InitiateCallParams
): Promise<InitiateCallResponse> {
  const agentCfg = AGENT_CONFIG[params.agentType];

  const body = {
    name: params.patientName,
    mobile_number: params.mobileNumber,
    agent_id: agentCfg.agentId,
    from_number_id: agentCfg.fromNumberId,
    custom_args_values: buildCustomArgs(params),
    call_config: {
      call_retry_config: {
        retry_count: 0,
        retry_busy: 5,
        retry_not_picked: 5,
        retry_failed: 10,
      },
      max_call_length: 300,
      idle_timeout_warning: 5,
      idle_timeout_end: 10,
    },
  };

  console.log(`[RingAI] Initiating ${params.agentType} call to ${params.mobileNumber} via agent ${agentCfg.agentId}`);

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
