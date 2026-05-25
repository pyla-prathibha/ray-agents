import { NextRequest, NextResponse } from "next/server";
import { initiateOutboundCall, type OutboundAgentType } from "@/services/ringai";
import { createCall } from "@/services/callEventStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patient_name,
      mobile_number,
      doctor_name,
      doctor_specialty,
      agent_type = "post-opd",
      call_scenario,
    } = body;

    if (!mobile_number) {
      return NextResponse.json(
        { error: "mobile_number is required" },
        { status: 400 }
      );
    }

    const phone = mobile_number.startsWith("+")
      ? mobile_number
      : `+91${mobile_number.replace(/\D/g, "")}`;

    const result = await initiateOutboundCall({
      patientName: patient_name || "Patient",
      mobileNumber: phone,
      agentType: agent_type as OutboundAgentType,
      customArgs: {
        patient_name: patient_name || "Patient",
        doctor_name: doctor_name || "Dr. Victor Mag",
        doctor_specialty: doctor_specialty || "Dentist",
        ...(call_scenario ? { call_scenario } : {}),
      },
    });

    createCall(result.call_id, agent_type);

    return NextResponse.json({
      success: true,
      call_id: result.call_id,
      call_status: result.call_status,
      agent_type,
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
