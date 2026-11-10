# Local verification

Checked 10 November 2026. This records a local instructional demo, not a clinic launch or a WebMCP integration result.

## Automated

- TypeScript check: passed.
- Next.js production build: passed.
- A clean isolated source copy installed successfully from its own lockfile using `npm ci` and built successfully, without the monorepo's dependencies or local database.
- 13 Node tests: passed. Covered disk persistence, idempotent retries, canonical payload order/normalization, changed-payload conflicts, duplicate and overlapping bookings, scheduling windows/lunch, London dates, invalid input, reconciliation after the booking date, local reset and same-origin checks.

## Browser

Surface: Codex desktop's in-app browser, controlled through CUA. Desktop layout checked at 1440 × 1000; responsive layout checked at 390 × 844. These are viewport checks, not physical Android/iPhone or a named external AI-client compatibility test.

- Reference-style hero and navigation rendered with the local tooth asset.
- Book appointment opened the native modal, calendar, visit selector and available slots.
- A routine check-up was booked with fictional details and a confirmed saved reference.
- After a full reload the appointment remained in the appointment list.
- Its booked time was absent from the next availability query shown in the form.
- Mobile hero spacing was corrected so text and the main button are not obscured by the illustration.
- The mobile calendar uses a stacked layout with larger day and time controls; month navigation was checked.
- A second visit type on a different calendar month was booked successfully at the mobile viewport.
- Resetting the demo removed both test bookings and restored the previously occupied slot. The delivered local calendar is empty.
- After a full reload, an immediate browser-agent click opened the appointment view. Entry buttons stay disabled until hydration has attached their handlers.
- No browser console errors were observed in the completed flow.

The browser test exposed an origin-check mismatch between Next's internal localhost URL and the request's actual 127.0.0.1 Host. The check now matches the Origin against the actual Host, without accepting forwarded-host overrides. Regression tests cover the legitimate request and unrelated/null/different-port origins.

Captured screenshots are under `assets/previews/`. No real patient details were used. Before learner distribution, pin an immutable starter revision, repeat installation on the intended operating systems, and test the exact agent/browser bridge selected for both normal browser booking and WebMCP invocation. No speed or reliability improvement has been measured yet.
