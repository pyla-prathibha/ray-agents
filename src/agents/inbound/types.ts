export interface InboundCallResult {
  intent: string;
  booking_confirmed: boolean;
  details: {
    doctor: string;
    date: string;
    time: string;
    specialty: string;
  };
  whatsapp_sent: boolean;
}
