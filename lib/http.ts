import { BookingError } from "./booking-store.ts";

export function errorResponse(error: unknown) {
  if (error instanceof BookingError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error("The local appointment operation failed.");
  return Response.json(
    { error: "We couldn't confirm the save. Please retry the same request." },
    { status: 500 },
  );
}

export function checkOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // Local command-line clients do not send a browser Origin.
  const url = new URL(request.url);
  // Next can normalize the internal URL to localhost while the browser uses 127.0.0.1.
  // Match the actual HTTP Host, without trusting forwarded host headers.
  const host = request.headers.get("host") ?? url.host;
  if (origin !== `${url.protocol}//${host}`)
    throw new BookingError(
      "This demo only accepts requests from its own website.",
      403,
    );
}
