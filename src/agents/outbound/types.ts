export interface OutboundCallResult {
  callee_name: string;
  mobile_number: string;
  classification: string;
  next_steps: {
    scheduled_appointment_id: string;
    appointment_date: string;
    appointment_time: string;
    doctor: string;
    specialty: string;
  };
  lead_quality: "high" | "medium" | "low";
  retry_count: number;
}
