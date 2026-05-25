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

  const requestStart = Date.now();
  console.log(`[ClinicData] GET request started for clinicId=${clinicId}`);
  try {
    const data = await fetchClinicData(clinicId);
    console.log(`[ClinicData] GET request completed in ${Date.now() - requestStart}ms for clinicId=${clinicId}`);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`[ClinicData] Fetch failed after ${Date.now() - requestStart}ms:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch clinic data" },
      { status: 500 }
    );
  }
}
