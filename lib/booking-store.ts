// Local instructional app only. The UI and a future WebMCP adapter share these operations.
import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  addDays,
  BOOKING_WINDOW_DAYS,
  candidateTimes,
  CLINIC_TIMEZONE,
  clinicToday,
  getService,
  timeToMinutes,
  validDate,
} from "./clinic.ts";
import type {
  Availability,
  Booking,
  BookingInput,
  ServiceId,
} from "./clinic.ts";

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

type StoreOptions = { path?: string; now?: Date };
type BookingRow = {
  id: string;
  operation_id: string;
  payload_hash: string;
  service_id: ServiceId;
  date: string;
  time: string;
  start_minute: number;
  end_minute: number;
  name: string;
  email: string;
  created_at: string;
};

function openDatabase(path = join(process.cwd(), ".data", "dentiva.sqlite")) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL UNIQUE,
      payload_hash TEXT NOT NULL,
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      start_minute INTEGER NOT NULL,
      end_minute INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS appointment_date ON appointments(date, start_minute, end_minute);
  `);
  return db;
}

function publicBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    reference: `DV-${row.id.slice(0, 8).toUpperCase()}`,
    serviceId: row.service_id,
    date: row.date,
    time: row.time,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export function availability(
  date: string,
  serviceId: string,
  options: StoreOptions = {},
): Availability {
  if (!validDate(date) || !getService(serviceId))
    throw new BookingError("Choose a valid date and visit type.");
  const now = options.now ?? new Date();
  const service = getService(serviceId)!;
  const db = openDatabase(options.path);
  try {
    const occupied = db
      .prepare(
        "SELECT start_minute, end_minute FROM appointments WHERE date = ?",
      )
      .all(date) as { start_minute: number; end_minute: number }[];
    const slots = candidateTimes(date, service.id, now)
      .filter((time) => {
        const start = timeToMinutes(time);
        return !occupied.some(
          (row) =>
            start < row.end_minute &&
            start + service.duration > row.start_minute,
        );
      })
      .map((time) => ({ time, label: time }));
    const today = clinicToday(now);
    return {
      date,
      serviceId: service.id,
      slots,
      timezone: CLINIC_TIMEZONE,
      today,
      lastDate: addDays(today, BOOKING_WINDOW_DAYS),
    };
  } finally {
    db.close();
  }
}

function normalizeInput(value: unknown): BookingInput {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BookingError("Please complete the booking form.");
  const data = value as Record<string, unknown>;
  const keys = ["serviceId", "date", "time", "name", "email", "operationId"];
  if (
    Object.keys(data).some((key) => !keys.includes(key)) ||
    keys.some((key) => typeof data[key] !== "string")
  ) {
    throw new BookingError("The booking details are incomplete or invalid.");
  }
  const input = data as unknown as BookingInput;
  const normalized: BookingInput = {
    serviceId: input.serviceId,
    date: input.date,
    time: input.time,
    name: input.name.trim().replace(/\s+/g, " "),
    email: input.email.trim().toLowerCase(),
    operationId: input.operationId,
  };
  if (
    !getService(input.serviceId) ||
    !validDate(input.date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)
  ) {
    throw new BookingError("Please choose a valid visit, date and time.");
  }
  if (normalized.name.length < 2 || normalized.name.length > 100)
    throw new BookingError("Please enter a name between 2 and 100 characters.");
  if (
    normalized.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)
  )
    throw new BookingError("Please enter a valid email address.");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.operationId,
    )
  ) {
    throw new BookingError(
      "The booking request is invalid. Please reopen the form.",
    );
  }
  return normalized;
}

export function bookAppointment(
  value: unknown,
  options: StoreOptions = {},
): Booking {
  const input = normalizeInput(value);
  const { operationId, ...payload } = input;
  const hash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const now = options.now ?? new Date();
  const db = openDatabase(options.path);
  try {
    // One transaction protects the availability check and insert across processes/tabs.
    db.exec("BEGIN IMMEDIATE");
    const previous = db
      .prepare("SELECT * FROM appointments WHERE operation_id = ?")
      .get(operationId) as BookingRow | undefined;
    if (previous) {
      if (previous.payload_hash !== hash)
        throw new BookingError(
          "This request was already used for different details. Please start a new booking.",
          409,
        );
      db.exec("COMMIT");
      return publicBooking(previous);
    }
    if (
      !candidateTimes(input.date, input.serviceId, now).includes(input.time)
    ) {
      throw new BookingError(
        "That time is outside our available booking hours. Please choose another slot.",
        409,
      );
    }
    const start = timeToMinutes(input.time);
    const end = start + getService(input.serviceId)!.duration;
    const conflict = db
      .prepare(
        "SELECT id FROM appointments WHERE date = ? AND start_minute < ? AND end_minute > ?",
      )
      .get(input.date, end, start);
    if (conflict)
      throw new BookingError(
        "That appointment has just been taken. Please choose another time.",
        409,
      );
    const id = randomUUID();
    const createdAt = now.toISOString();
    db.prepare(
      `INSERT INTO appointments
      (id, operation_id, payload_hash, service_id, date, time, start_minute, end_minute, name, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      operationId,
      hash,
      input.serviceId,
      input.date,
      input.time,
      start,
      end,
      input.name,
      input.email,
      createdAt,
    );
    db.exec("COMMIT");
    return {
      id,
      reference: `DV-${id.slice(0, 8).toUpperCase()}`,
      ...payload,
      createdAt,
    };
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

export function listAppointments(options: StoreOptions = {}): Booking[] {
  const db = openDatabase(options.path);
  try {
    return (
      db
        .prepare("SELECT * FROM appointments ORDER BY date, time")
        .all() as BookingRow[]
    ).map(publicBooking);
  } finally {
    db.close();
  }
}

export function resetAppointments(options: StoreOptions = {}): void {
  const db = openDatabase(options.path);
  try {
    db.exec("DELETE FROM appointments");
  } finally {
    db.close();
  }
}
