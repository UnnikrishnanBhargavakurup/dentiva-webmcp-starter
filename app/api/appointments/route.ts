import {
  bookAppointment,
  BookingError,
  listAppointments,
} from "@/lib/booking-store";
import { checkOrigin, errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(
      { appointments: listAppointments() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.text();
    if (body.length > 4096)
      throw new BookingError("The booking request is too large.");
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      throw new BookingError("The booking request is invalid.");
    }
    return Response.json(
      { appointment: bookAppointment(value) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
