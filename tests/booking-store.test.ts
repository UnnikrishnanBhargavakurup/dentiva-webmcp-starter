import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  availability,
  bookAppointment,
  BookingError,
  listAppointments,
  resetAppointments,
} from "../lib/booking-store.ts";
import { candidateTimes, clinicToday, isBookableDate } from "../lib/clinic.ts";
import type { BookingInput } from "../lib/clinic.ts";

const now = new Date("2030-06-10T08:00:00Z");
const fixture = (): BookingInput => ({
  serviceId: "checkup",
  date: "2030-06-11",
  time: "10:00",
  name: "Alex Taylor",
  email: "alex@example.com",
  operationId: randomUUID(),
});

function store() {
  const directory = mkdtempSync(join(tmpdir(), "dentiva-test-"));
  return {
    options: { path: join(directory, "test.sqlite"), now },
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

test("bookings persist when the database connection is reopened", () => {
  const { options, cleanup } = store();
  try {
    const booking = bookAppointment(fixture(), options);
    assert.equal(listAppointments(options)[0].id, booking.id);
    assert.match(booking.reference, /^DV-[A-F0-9]{8}$/);
    assert.equal(
      availability(booking.date, "checkup", options).slots.some(
        (slot) => slot.time === "10:00",
      ),
      false,
    );
  } finally {
    cleanup();
  }
});

test("retrying a successful operation returns the same booking without a duplicate", () => {
  const { options, cleanup } = store();
  try {
    const input = fixture();
    const first = bookAppointment(input, options);
    const second = bookAppointment(input, options);
    assert.deepEqual(first, second);
    assert.equal(listAppointments(options).length, 1);
  } finally {
    cleanup();
  }
});

test("operation retries ignore JSON property order and normalized contact whitespace", () => {
  const { options, cleanup } = store();
  try {
    const input = fixture();
    const first = bookAppointment(input, options);
    const reordered = {
      operationId: input.operationId,
      email: " ALEX@EXAMPLE.COM ",
      name: " Alex  Taylor ",
      time: input.time,
      date: input.date,
      serviceId: input.serviceId,
    };
    assert.equal(bookAppointment(reordered, options).id, first.id);
  } finally {
    cleanup();
  }
});

test("reusing an operation key for different details conflicts", () => {
  const { options, cleanup } = store();
  try {
    const input = fixture();
    bookAppointment(input, options);
    assert.throws(
      () => bookAppointment({ ...input, time: "11:00" }, options),
      (error) => error instanceof BookingError && error.status === 409,
    );
    assert.equal(listAppointments(options).length, 1);
  } finally {
    cleanup();
  }
});

test("another request cannot double-book an occupied slot", () => {
  const { options, cleanup } = store();
  try {
    bookAppointment(fixture(), options);
    assert.throws(() => bookAppointment(fixture(), options), /just been taken/);
    assert.equal(listAppointments(options).length, 1);
  } finally {
    cleanup();
  }
});

test("service durations prevent overlapping bookings across different start times", () => {
  const { options, cleanup } = store();
  try {
    bookAppointment(
      { ...fixture(), serviceId: "cleaning", time: "10:00" },
      options,
    );
    assert.throws(
      () => bookAppointment({ ...fixture(), time: "10:30" }, options),
      /just been taken/,
    );
    const slots = availability("2030-06-11", "checkup", options).slots.map(
      (slot) => slot.time,
    );
    assert.equal(slots.includes("10:30"), false);
    assert.equal(slots.includes("11:00"), true);
    assert.ok(bookAppointment({ ...fixture(), time: "11:00" }, options).id);
  } finally {
    cleanup();
  }
});

test("past days, Sundays, outside-window dates and lunch are unavailable", () => {
  const { options, cleanup } = store();
  try {
    for (const date of ["2030-06-09", "2030-06-16", "2030-07-09"]) {
      assert.equal(availability(date, "checkup", options).slots.length, 0);
      assert.throws(
        () => bookAppointment({ ...fixture(), date }, options),
        /outside/,
      );
    }
    assert.throws(
      () => bookAppointment({ ...fixture(), time: "12:30" }, options),
      /outside/,
    );
    assert.throws(
      () =>
        bookAppointment(
          { ...fixture(), serviceId: "cleaning", time: "12:00" },
          options,
        ),
      /outside/,
    );
  } finally {
    cleanup();
  }
});

test("clinic dates follow London time and today's past times cannot be booked", () => {
  assert.equal(clinicToday(new Date("2030-06-10T23:30:00Z")), "2030-06-11");
  assert.equal(
    candidateTimes("2030-06-10", "checkup", now).includes("09:00"),
    false,
  );
  assert.equal(
    candidateTimes("2030-06-10", "checkup", now).includes("09:30"),
    true,
  );
  assert.equal(isBookableDate("2030-02-30", "2030-02-01"), false);
});

test("invalid or unexpected booking inputs never create a record", () => {
  const { options, cleanup } = store();
  try {
    for (const input of [
      null,
      {},
      { ...fixture(), email: "invalid" },
      { ...fixture(), name: " " },
      { ...fixture(), date: "2030-02-30" },
      { ...fixture(), time: "25:00" },
      { ...fixture(), operationId: "bad" },
      { ...fixture(), arbitrary: "field" },
    ]) {
      assert.throws(() => bookAppointment(input, options), BookingError);
    }
    assert.equal(listAppointments(options).length, 0);
  } finally {
    cleanup();
  }
});

test("an idempotent retry can reconcile a saved booking after its day has passed", () => {
  const { options, cleanup } = store();
  try {
    const input = fixture();
    const first = bookAppointment(input, options);
    assert.equal(
      bookAppointment(input, {
        ...options,
        now: new Date("2030-07-10T08:00:00Z"),
      }).id,
      first.id,
    );
  } finally {
    cleanup();
  }
});

test("reset clears only the local demo calendar and restores availability", () => {
  const { options, cleanup } = store();
  try {
    bookAppointment(fixture(), options);
    resetAppointments(options);
    assert.equal(listAppointments(options).length, 0);
    assert.equal(
      availability("2030-06-11", "checkup", options).slots.some(
        (slot) => slot.time === "10:00",
      ),
      true,
    );
  } finally {
    cleanup();
  }
});
