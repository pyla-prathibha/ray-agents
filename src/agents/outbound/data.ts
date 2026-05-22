export function buildOutboundDialogue(
  name: string,
  doctor: string,
  specialty: string,
  phone: string
) {
  return [
    {
      sender: "ai" as const,
      text: `Hello ${name}! I hope you're feeling better. This is Ray, calling on behalf of ${doctor}'s office at the ${specialty} department regarding your recent OPD consultation.`,
    },
    {
      sender: "patient" as const,
      text: "Oh, hello. Yes, I'm doing better, thank you. How can I help you?",
    },
    {
      sender: "ai" as const,
      text: `Glad to hear that! ${doctor} asked me to check in on your recovery. I see in your notes that a follow-up review was recommended. Would you like to schedule that follow-up appointment today?`,
    },
    {
      sender: "patient" as const,
      text: "Yes, actually. I wanted to schedule it. Do you have any open slots this coming Saturday?",
    },
    {
      sender: "ai" as const,
      text: `Yes, we do! For next Saturday, we have slots open at 11:30 AM and 3:30 PM with ${doctor}. Would either of those be convenient for you?`,
    },
    {
      sender: "patient" as const,
      text: "Saturday at 11:30 AM works perfectly.",
    },
    {
      sender: "ai" as const,
      text: `Wonderful! I have booked your follow-up appointment for Saturday at 11:30 AM with ${doctor}. I have confirmed this in the system, and a WhatsApp confirmation is headed to your number +91 ${phone} now.`,
    },
    {
      sender: "patient" as const,
      text: "Thank you so much, Ray. Appreciate the call!",
    },
    {
      sender: "ai" as const,
      text: "It is my absolute pleasure! Have a healthy and wonderful week ahead.",
    },
  ];
}

export const OUTBOUND_EVENTS = [
  "call_initiated",
  "call_started",
  "call_completed",
  "all_processing_completed",
] as const;

export const QUEUE_PATIENTS = [
  { id: "Anjali-Sharma", name: "Anjali Sharma", meta: "Invisalign", visit: "Yesterday", cohort: "Invisalign Review", cohortStyle: "purple", status: "Booked" },
  { id: "Ramesh-Iyer", name: "Ramesh Iyer", meta: "Root Canal", visit: "2 days ago", cohort: "Root Canal Review", cohortStyle: "blue", status: "Called" },
  { id: "Priya-Mehrotra", name: "Priya Mehrotra", meta: "Crown Fitting", visit: "2 days ago", cohort: "Crown Fitting", cohortStyle: "orange", status: "Queued" },
  { id: "Sneha-Joshi", name: "Sneha Joshi", meta: "Invisalign Alignment", visit: "3 days ago", cohort: "Invisalign Review", cohortStyle: "purple", status: "Queued" },
  { id: "Rohit-Kumar", name: "Rohit Kumar", meta: "Dental Implants", visit: "3 days ago", cohort: "Implants Review", cohortStyle: "blue", status: "Voicemail" },
  { id: "Kavita-Desai", name: "Kavita Desai", meta: "Teeth Cleaning", visit: "Yesterday", cohort: "Dental Hygiene", cohortStyle: "green", status: "Booked" },
];

export const SYSTEM_PARAMS = ["callee_name", "mobile_number"] as const;
export const CUSTOM_PARAMS = [
  "patient_id", "patient_name", "doctor_name", "doctor_specialty",
  "appointment_date", "appointment_time", "scheduler_appointment_id",
  "appointment_id", "doctor_reference_id", "practice_reference_id",
  "doctor_id", "practice_id",
] as const;
