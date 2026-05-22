import { NextRequest, NextResponse } from "next/server";
import { initiateOutboundCall } from "@/services/ringai";
import { createCall } from "@/services/callEventStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patient_name,
      mobile_number,
      doctor_name,
      doctor_specialty,
      patient_id,
      appointment_date,
      appointment_time,
      scheduler_appointment_id,
      appointment_id,
      doctor_reference_id,
      practice_reference_id,
      doctor_id,
      practice_id,
    } = body;

    if (!patient_name || !mobile_number) {
      return NextResponse.json(
        { error: "patient_name and mobile_number are required" },
        { status: 400 }
      );
    }

    // Ensure E.164 format
    const phone = mobile_number.startsWith("+")
      ? mobile_number
      : `+91${mobile_number.replace(/\D/g, "")}`;

    const result = await initiateOutboundCall({
      patientName: patient_name,
      mobileNumber: phone,
      customArgs: {
        patient_id: patient_id || "",
        patient_name: patient_name,
        doctor_name: doctor_name || "Dr. Victor Mag",
        doctor_specialty: doctor_specialty || "Dentist",
        appointment_date: appointment_date || new Date().toISOString().split("T")[0],
        appointment_time: appointment_time || "10:30",
        scheduler_appointment_id: scheduler_appointment_id || "",
        appointment_id: appointment_id || "",
        doctor_reference_id: doctor_reference_id || "",
        practice_reference_id: practice_reference_id || "",
        doctor_id: doctor_id || "",
        practice_id: practice_id || "",
      },
    });

    // Track the call in our event store
    createCall(result.call_id, "outbound");

    return NextResponse.json({
      success: true,
      call_id: result.call_id,
      call_status: result.call_status,
    });
  } catch (error) {
    console.error("[API] Outbound call initiation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Call initiation failed",
      },
      { status: 500 }
    );
  }
}
