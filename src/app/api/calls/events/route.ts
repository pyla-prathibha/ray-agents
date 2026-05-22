import { NextRequest, NextResponse } from "next/server";
import { getCallState, getRecentCalls } from "@/services/callEventStore";

export async function GET(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("call_id");

  if (callId) {
    const state = getCallState(callId);
    if (!state) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, call: state });
  }

  // No call_id — return recent calls
  const recent = getRecentCalls();
  return NextResponse.json({ success: true, calls: recent });
}
