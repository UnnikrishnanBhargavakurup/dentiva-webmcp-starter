import { availability } from "@/lib/booking-store";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return Response.json(
      availability(params.get("date") ?? "", params.get("service") ?? ""),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
