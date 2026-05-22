import { NextRequest, NextResponse } from "next/server";
import { fetchClinicData } from "@/services/demandGen";

export async function GET(request: NextRequest) {
  const clinicId = request.nextUrl.searchParams.get("clinicId");
  
  if (!clinicId) {
    return NextResponse.json(
      { success: false, error: "clinicId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchClinicData(clinicId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ClinicData] Fetch failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch clinic data" },
      { status: 500 }
    );
  }
}
