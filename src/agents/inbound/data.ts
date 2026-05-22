export const INBOUND_DIALOGUE = [
  {
    sender: "ai" as const,
    text: "Hi! Thank you for calling Dr. Victor Mag's Dental Clinic. This is Ray, your AI healthcare assistant. How can I help you today?",
  },
  {
    sender: "patient" as const,
    text: "Hello, I wanted to schedule an appointment with Dr. Victor Mag for teeth alignment issues.",
  },
  {
    sender: "ai" as const,
    text: "I can absolutely help you with that. Dr. Victor Mag is available this coming Saturday, May 23rd. We have slots open at 10:30 AM, 2:00 PM, and 4:15 PM. Do any of these work for you?",
  },
  {
    sender: "patient" as const,
    text: "Saturday at 10:30 AM works great for me.",
  },
  {
    sender: "ai" as const,
    text: "Perfect! I've reserved that slot for you. Calling our Dhanvantri booking engine now... Confirmed! Saturday, May 23rd at 10:30 AM with Dr. Victor Mag. A confirmation WhatsApp is on its way.",
  },
  {
    sender: "patient" as const,
    text: "Awesome. Thank you so much!",
  },
  {
    sender: "ai" as const,
    text: "You're very welcome! Feel free to call us back anytime. Have a healthy day!",
  },
];

export const INBOUND_EVENTS = [
  "call_started",
  "call_completed",
  "recording_completed",
  "all_processing_completed",
] as const;

export const RECENT_CALLS = [
  { num: "+91 98765 43210", time: "5:22 PM", dur: "3m 14s", cls: "appointment_booked", status: "Booked" },
  { num: "+91 91234 56789", time: "4:47 PM", dur: "1m 52s", cls: "query_resolved", status: "Done" },
  { num: "+91 88001 23456", time: "4:11 PM", dur: "\u2014", cls: "incomplete_call", status: "Pending" },
  { num: "+91 77889 01234", time: "3:38 PM", dur: "2m 06s", cls: "feedback_collected", status: "Done" },
];
