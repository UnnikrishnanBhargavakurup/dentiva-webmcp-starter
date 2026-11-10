import { resetAppointments } from "@/lib/booking-store";
import { checkOrigin, errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  try {
    checkOrigin(request);
    resetAppointments();
    return Response.json({ reset: true });
  } catch (error) {
    return errorResponse(error);
  }
}
