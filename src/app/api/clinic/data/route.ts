import { NextRequest, NextResponse } from "next/server";
import { fetchClinicData } from "@/services/demandGen";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      // Whitespace keepalive every 20s so upstream proxies (Cloudflare ~100s
      // idle timeout) don't kill the connection during the long Claude call.
      // JSON.parse ignores leading/trailing whitespace, so the client's
      // res.json() works unchanged.
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(" "));
        } catch {
          // controller already closed
        }
      }, 20_000);

      try {
        const data = await fetchClinicData(clinicId);
        console.log(`[ClinicData] GET request completed in ${Date.now() - requestStart}ms for clinicId=${clinicId}`);
        controller.enqueue(encoder.encode(JSON.stringify({ success: true, data })));
      } catch (error) {
        console.error(`[ClinicData] Fetch failed after ${Date.now() - requestStart}ms:`, error);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Failed to fetch clinic data",
            })
          )
        );
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}