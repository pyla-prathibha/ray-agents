import { NextResponse } from "next/server";
import { runDemandGenAnalysis } from "@/services/demandGen";

export async function GET() {
  try {
    const report = await runDemandGenAnalysis();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[DemandGen] Analysis failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
